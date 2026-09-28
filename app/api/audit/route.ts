import { fetchPublicPage, AuditError } from '../../../lib/audit/fetch-page';
import { analyzePage } from '../../../lib/audit/analyze';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

// Best-effort per-instance limits; no paid AI calls or persistent audit storage.
const attempts = new Map<string, { count: number; reset: number }>();
let active = 0;
const headers = { 'Cache-Control': 'no-store' };

export async function POST(req: Request) {
  const ip = req.headers.get('x-vercel-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('x-real-ip') || 'unknown';
  const now = Date.now();
  for (const [key, value] of attempts) if (value.reset <= now) attempts.delete(key);
  const bucket = attempts.get(ip);
  if ((bucket && bucket.count >= 10) || active >= 4 || (!bucket && attempts.size >= 1000)) {
    return Response.json({ error: 'Trop de demandes. Réessayez dans une minute.' },
      { status: 429, headers: { ...headers, 'Retry-After': '60' } });
  }
  attempts.set(ip, { count: (bucket?.count || 0) + 1, reset: bucket?.reset || now + 60_000 });
  active++;
  try {
    const reader = req.body?.getReader();
    if (!reader) throw new AuditError('Indiquez l’adresse de la page à analyser.', 400);
    const chunks: Uint8Array[] = [];
    let size = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > 2048) throw new AuditError('Adresse trop longue.', 400);
        chunks.push(value);
      }
    } finally { await reader.cancel(); }
    let body: { url?: unknown };
    try { body = JSON.parse(Buffer.concat(chunks).toString('utf8')); }
    catch { throw new AuditError('La demande est invalide.', 400); }
    if (typeof body?.url !== 'string') throw new AuditError('Indiquez une adresse de site.', 400);
    const page = await fetchPublicPage(body.url);
    return Response.json(analyzePage(page), { headers });
  } catch (error) {
    const known = error instanceof AuditError;
    return Response.json({ error: known ? error.message : 'Impossible d’analyser cette page pour le moment. Réessayez plus tard.' },
      { status: known ? error.status : 502, headers });
  } finally { active--; }
}
