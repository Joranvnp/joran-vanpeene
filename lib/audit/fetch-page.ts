import { lookup } from 'node:dns/promises';
import { request as httpRequest } from 'node:http';
import { request as httpsRequest } from 'node:https';
import { isIP } from 'node:net';
import { createBrotliDecompress, createGunzip, createInflate } from 'node:zlib';
import ipaddr from 'ipaddr.js';

const MAX_BYTES = 2 * 1024 * 1024;
const TIMEOUT_MS = 18_000;

export class AuditError extends Error {
  constructor(message: string, public status = 422) { super(message); }
}

export type FetchedPage = {
  requestedUrl: string;
  url: string;
  html: Buffer;
  contentType: string;
  robotsHeader: string;
  status: number;
  redirects: number;
  fetchedAt: string;
};

export function isPublicAddress(address: string) {
  try {
    const parsed = ipaddr.parse(address);
    if (parsed.range() !== 'unicast') return false;
    if (parsed.kind() === 'ipv6') return parsed.match(ipaddr.parse('2000::') as any, 3);
    return true;
  } catch { return false; }
}

export function normalizeUrl(input: string): URL {
  const raw = input.trim();
  if (!raw || raw.length > 1500) throw new AuditError('Indiquez une adresse de site valide.', 400);
  let url: URL;
  try { url = new URL(/^[a-z][a-z\d+.-]*:/i.test(raw) ? raw : `https://${raw}`); }
  catch { throw new AuditError('Cette adresse n’est pas valide. Exemple : https://votre-site.fr', 400); }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.port) {
    throw new AuditError('Utilisez une adresse publique HTTP ou HTTPS, sans identifiants ni port personnalisé.', 400);
  }
  const host = url.hostname.replace(/^\[|\]$/g, '').replace(/\.$/, '');
  if (!host.includes('.') && !isIP(host)) throw new AuditError('Indiquez un nom de domaine public.', 400);
  if (/\.(localhost|local|internal|test|invalid|example)$/i.test(host) || host === 'localhost'
    || (isIP(host) && !isPublicAddress(host))) {
    throw new AuditError('Seuls les sites accessibles sur Internet peuvent être analysés.', 400);
  }
  url.hash = '';
  return url;
}

type Target = { address: string; family: number };
export async function resolvePublicTarget(hostname: string, signal: AbortSignal): Promise<Target> {
  const host = hostname.replace(/^\[|\]$/g, '');
  const addresses = isIP(host) ? [{ address: host, family: isIP(host) }]
    : await new Promise<Target[]>((resolve, reject) => {
      const abort = () => reject(new AuditError('Le site met trop de temps à répondre. Réessayez plus tard.', 504));
      if (signal.aborted) return abort();
      signal.addEventListener('abort', abort, { once: true });
      lookup(host, { all: true }).then(resolve, () => reject(new AuditError('Ce nom de domaine est introuvable ou temporairement indisponible.')))
        .finally(() => signal.removeEventListener('abort', abort));
    });
  if (!addresses.length || addresses.some(a => !isPublicAddress(a.address))) {
    throw new AuditError('Cette adresse ne correspond pas à un site public autorisé.', 400);
  }
  return addresses.find(a => a.family === 4) || addresses[0];
}

function getPage(url: URL, target: Target, signal: AbortSignal): Promise<{
  status: number; location?: string; html: Buffer; contentType: string; robotsHeader: string;
}> {
  return new Promise((resolve, reject) => {
    const makeRequest = url.protocol === 'https:' ? httpsRequest : httpRequest;
    const req = makeRequest(url, {
      method: 'GET', agent: false, signal,
      // Pin the validated DNS result, retaining the original Host and TLS identity.
      lookup: ((_hostname: string, options: any, callback: any) => {
        if (options?.all) callback(null, [target]);
        else callback(null, target.address, target.family);
      }) as any,
      headers: {
        'User-Agent': 'JoranWebAudit/1.0 (+https://joran-vanpeene.fr/#lab)',
        Accept: 'text/html,application/xhtml+xml;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
      },
    }, res => {
      const status = res.statusCode || 0;
      const contentType = String(res.headers['content-type'] || '');
      const robotsHeader = String(res.headers['x-robots-tag'] || '');
      if ([301, 302, 303, 307, 308].includes(status)) {
        res.destroy();
        resolve({ status, location: res.headers.location, html: Buffer.alloc(0), contentType, robotsHeader });
        return;
      }
      const fail = (error: Error) => { res.destroy(); req.destroy(); reject(error); };
      if (status < 200 || status >= 300) {
        fail(new AuditError(status === 403 || status === 429
          ? 'Ce site bloque les consultations automatiques. Aucun résultat n’a été inventé.'
          : `La page répond avec une erreur HTTP ${status}. Vérifiez son adresse.`));
        return;
      }
      if (!/^(text\/html|application\/xhtml\+xml)(;|$)/i.test(contentType)) {
        fail(new AuditError('Cette adresse ne renvoie pas une page HTML. Les PDF et autres fichiers ne sont pas pris en charge.'));
        return;
      }
      const encoding = String(res.headers['content-encoding'] || 'identity').toLowerCase();
      const decoder = encoding === 'gzip' ? createGunzip() : encoding === 'br' ? createBrotliDecompress()
        : encoding === 'deflate' ? createInflate() : null;
      if (!decoder && encoding !== 'identity') { fail(new AuditError('Le format de compression de cette page n’est pas pris en charge.')); return; }
      const stream = decoder ? res.pipe(decoder) : res;
      const chunks: Buffer[] = [];
      let total = 0;
      let wireBytes = 0;
      const streamFail = (error: Error) => { if (decoder) decoder.destroy(); fail(error); };
      res.on('data', chunk => { wireBytes += chunk.length; if (wireBytes > MAX_BYTES) streamFail(new AuditError('Page trop volumineuse : la limite est de 2 Mo de HTML.')); });
      res.on('error', streamFail);
      stream.on('error', streamFail);
      stream.on('data', chunk => {
        total += chunk.length;
        if (total > MAX_BYTES) { streamFail(new AuditError('Page trop volumineuse : la limite est de 2 Mo de HTML.')); return; }
        chunks.push(Buffer.from(chunk));
      });
      stream.on('end', () => resolve({ status, contentType, robotsHeader, html: Buffer.concat(chunks) }));
    });
    req.on('error', () => {
      reject(signal.aborted ? new AuditError('Le site met trop de temps à répondre. Réessayez plus tard.', 504)
        : new AuditError('Connexion impossible : le site est indisponible, bloque l’accès ou présente un problème de certificat HTTPS.'));
    });
    req.end();
  });
}

export async function fetchPublicPage(input: string): Promise<FetchedPage> {
  let url = normalizeUrl(input);
  const requestedUrl = url.href;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    for (let redirects = 0; redirects <= 4; redirects++) {
      const target = await resolvePublicTarget(url.hostname, controller.signal);
      const response = await getPage(url, target, controller.signal);
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        if (!response.location) throw new AuditError('La redirection du site ne contient pas d’adresse de destination.');
        url = normalizeUrl(new URL(response.location, url).href);
        continue;
      }
      return { ...response, requestedUrl, url: url.href, redirects, fetchedAt: new Date().toISOString() };
    }
    throw new AuditError('Le site effectue trop de redirections. Essayez son adresse finale.');
  } finally { clearTimeout(timeout); }
}
