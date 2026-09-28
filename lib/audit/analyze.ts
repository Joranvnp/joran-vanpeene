import { loadBuffer } from 'cheerio';
import type { FetchedPage } from './fetch-page';
import { AuditError } from './fetch-page';

export type Check = {
  id: string;
  title: string;
  status: 'pass' | 'warning' | 'info';
  evidence: string;
  action?: string;
  priority?: 'haute' | 'moyenne';
};
const compact = (value: string, max = 220) => {
  const text = value.replace(/\s+/g, ' ').trim();
  return text.length > max ? `${text.slice(0, max)}…` : text;
};

export function analyzePage(page: FetchedPage) {
  const charset = page.contentType.match(/charset\s*=\s*["']?([^\s;"']+)/i)?.[1];
  const $ = loadBuffer(page.html, { encoding: charset ? { transportLayerEncodingLabel: charset } : undefined });
  const title = compact($('head title').first().text());
  // Refuse common bot interstitials: their HTML is not the requested site's content.
  if (/^(just a moment|attention required|access denied|security checkpoint|robot or human|vérification de sécurité)/i.test(title)
    || $('#challenge-running, #cf-challenge-running, form#challenge-form').length) {
    throw new AuditError('Le site affiche une vérification anti-robot. Son contenu réel n’a pas pu être analysé.');
  }
  const hasScripts = $('script[src], script[type="module"]').length > 0;
  $('script, style, noscript, template, [hidden], [aria-hidden="true"]').remove();
  const partial = hasScripts && compact($('body').text(), 1000).length < 100;
  const checks: Check[] = [];
  const add = (check: Check) => checks.push(check);
  const metas = (name: string) => $('head meta').filter((_, el) => ($(el).attr('name') || '').toLowerCase() === name);
  const https = page.url.startsWith('https:');
  add({ id: 'https', title: 'Connexion HTTPS', status: https ? 'pass' : 'warning',
    evidence: https ? 'La page finale a été récupérée en HTTPS avec validation du certificat.' : 'La page finale est servie en HTTP, sans chiffrement de la connexion.',
    ...(!https && { action: 'Activez un certificat HTTPS et redirigez les visiteurs HTTP vers HTTPS.', priority: 'haute' as const }) });

  const titleCount = $('head title').length;
  const titleOk = titleCount === 1 && !!title;
  add({ id: 'title', title: 'Titre de l’onglet et des résultats', status: titleOk ? 'pass' : 'warning',
    evidence: titleCount ? `${titleCount} balise(s) title. ${title ? `Texte : « ${title} »` : 'Le titre est vide.'}` : 'Aucune balise title dans le HTML reçu.',
    ...(!titleOk && { action: 'Ajoutez un seul titre descriptif de cette page, avec votre activité ou le sujet principal.', priority: 'haute' as const }) });

  const descriptions = metas('description');
  const description = compact(descriptions.first().attr('content') || '');
  const descriptionOk = descriptions.length === 1 && !!description;
  add({ id: 'description', title: 'Description pour les moteurs', status: descriptionOk ? 'pass' : 'warning',
    evidence: descriptions.length ? `${descriptions.length} description(s). ${description ? `Texte : « ${description} »` : 'La description est vide.'}` : 'Aucune meta description dans le HTML reçu.',
    ...(!descriptionOk && { action: 'Rédigez une seule description propre à cette page. Google peut l’utiliser comme extrait, sans garantie de l’afficher.', priority: 'moyenne' as const }) });

  const h1s = $('h1').filter((_, el) => !!compact($(el).text()));
  add({ id: 'h1', title: 'Titre principal dans la page', status: h1s.length ? 'pass' : partial ? 'info' : 'warning',
    evidence: h1s.length ? `${h1s.length} titre(s) H1 non vide(s). Premier : « ${compact(h1s.first().text())} »`
      : partial ? 'Contenu probablement ajouté par JavaScript : titre principal non vérifiable ici.' : 'Aucun titre H1 non vide dans le HTML reçu.',
    ...(!h1s.length && !partial && { action: 'Ajoutez un titre H1 clair qui décrit le contenu principal de cette page.', priority: 'moyenne' as const }) });

  const lang = compact($('html').attr('lang') || '', 40);
  let validLang = false;
  try { validLang = !!lang && Intl.getCanonicalLocales(lang).length > 0; } catch { /* invalid declaration */ }
  add({ id: 'language', title: 'Langue déclarée', status: validLang ? 'pass' : 'warning',
    evidence: lang ? `Attribut lang : « ${lang} »${validLang ? '.' : ', format non reconnu.'}` : 'L’élément html ne déclare pas de langue.',
    ...(!validLang && { action: 'Déclarez la langue principale avec un code valide, par exemple <html lang="fr"> pour une page en français.', priority: 'moyenne' as const }) });

  const viewport = metas('viewport').first().attr('content') || '';
  const mobile = /(?:^|[,;\s])width\s*=\s*device-width(?:[,;\s]|$)/i.test(viewport);
  add({ id: 'viewport', title: 'Réglage de largeur mobile', status: mobile ? 'pass' : 'warning',
    evidence: viewport ? `Viewport déclaré : « ${compact(viewport)} ». Cela ne vérifie pas la mise en page sur téléphone.` : 'Aucune meta viewport dans le HTML reçu.',
    ...(!mobile && { action: 'Déclarez width=device-width dans la meta viewport, puis vérifiez visuellement la page sur téléphone.', priority: 'moyenne' as const }) });

  const canonicals = $('head link').filter((_, el) => /(?:^|\s)canonical(?:\s|$)/i.test($(el).attr('rel') || ''));
  const canonical = canonicals.first().attr('href')?.trim();
  let canonicalUrl = '';
  try {
    if (canonical) {
      const resolved = new URL(canonical, page.url);
      if (['http:', 'https:'].includes(resolved.protocol) && !resolved.username && !resolved.password) canonicalUrl = resolved.href;
    }
  } catch { /* malformed URL */ }
  const canonicalOk = canonicals.length === 1 && !!canonicalUrl;
  add({ id: 'canonical', title: 'Adresse canonique déclarée', status: canonicalOk ? 'pass' : 'warning',
    evidence: canonicalOk ? `Adresse déclarée : ${compact(canonicalUrl)}. Sa destination n’a pas été visitée.`
      : canonicals.length ? 'La déclaration canonique est vide, invalide ou présente plusieurs fois.' : 'Aucun lien canonique déclaré. Ce n’est pas à lui seul un blocage d’indexation.',
    ...(!canonicalOk && { action: 'Vérifiez quelle URL doit être privilégiée si plusieurs adresses servent ce contenu, puis déclarez une canonique unique si nécessaire.', priority: 'moyenne' as const }) });

  const directives = [...metas('robots').toArray(), ...metas('googlebot').toArray()].map(el => $(el).attr('content') || '');
  if (page.robotsHeader) directives.push(page.robotsHeader);
  const noindex = directives.some(value => /(?:^|[\s,:])(?:noindex|none)(?:$|[\s,;])/i.test(value));
  add({ id: 'indexing', title: 'Directive d’exclusion des moteurs', status: noindex ? 'info' : 'pass',
    evidence: noindex ? `Une directive noindex ou none est présente : « ${compact(directives.join(' ; '))} ». L’exclusion peut être volontaire.`
      : 'Aucune directive noindex détectée dans les metas robots/googlebot ou l’en-tête X-Robots-Tag. Cela ne prouve pas que Google indexe cette page.',
    ...(noindex && { action: 'Si cette page doit apparaître sur Google, vérifiez pourquoi son indexation est désactivée avant de retirer la directive.' }) });

  const images = $('img');
  const missingAlt = images.filter((_, el) => $(el).attr('alt') === undefined);
  const emptyAlt = images.filter((_, el) => $(el).attr('alt') === '').length;
  add({ id: 'images', title: 'Attributs alternatifs des images', status: !images.length ? 'info' : missingAlt.length ? 'warning' : 'pass',
    evidence: !images.length ? 'Aucune image img dans le HTML reçu ; contrôle non applicable à ce contenu.'
      : `${images.length} image(s), ${missingAlt.length} sans attribut alt, ${emptyAlt} avec alt vide. Un alt vide convient aux images décoratives ; la pertinence des textes n’est pas évaluée.`,
    ...(missingAlt.length > 0 && { action: `Ajoutez un texte alternatif aux ${missingAlt.length} image(s) informatives sans alt, ou alt="" si elles sont purement décoratives.`, priority: 'haute' as const }) });

  const links = $('a[href]');
  const withoutLabel = links.filter((_, el) => {
    const link = $(el);
    const labelledBy = (link.attr('aria-labelledby') || '').split(/\s+/).filter(Boolean)
      .map(id => $('[id]').filter((_, node) => $(node).attr('id') === id).first().text()).join(' ');
    const alternatives = link.find('img[alt]').map((_, img) => $(img).attr('alt')).get().join(' ');
    const svgTitle = link.find('svg title').text();
    return !compact([link.attr('aria-label'), labelledBy, link.text(), alternatives, svgTitle, link.attr('title')].filter(Boolean).join(' '));
  });
  add({ id: 'links', title: 'Libellés détectables des liens', status: !links.length ? 'info' : withoutLabel.length ? 'warning' : 'pass',
    evidence: !links.length ? 'Aucun lien dans le HTML reçu ; contrôle non applicable à ce contenu.'
      : `${links.length} lien(s), ${withoutLabel.length} sans libellé détectable dans le HTML. Le nom accessible complet et la visibilité CSS ne sont pas calculés.`,
    ...(withoutLabel.length > 0 && { action: `Donnez un texte explicite ou un aria-label aux ${withoutLabel.length} lien(s) sans libellé détecté, puis vérifiez avec un lecteur d’écran.`, priority: 'haute' as const }) });

  const passed = checks.filter(c => c.status === 'pass').length;
  const warnings = checks.filter(c => c.status === 'warning');
  const checked = passed + warnings.length;
  const improvements = [...warnings].sort((a, b) => Number(b.priority === 'haute') - Number(a.priority === 'haute')).slice(0, 3);
  return {
    url: page.url, requestedUrl: page.requestedUrl, title, fetchedAt: page.fetchedAt,
    httpStatus: page.status, htmlBytes: page.html.length, redirects: page.redirects, partial,
    passed, checked, total: checks.length, notAssessed: checks.length - checked,
    summary: warnings.length ? `${warnings.length} point(s) à examiner dans le HTML de cette page.` : 'Aucun problème détecté parmi les contrôles évaluables. Cela ne constitue pas une validation complète du site.',
    checks, improvements,
    limitations: 'Diagnostic d’une seule page à partir du HTML reçu, sans exécuter JavaScript. La vitesse d’affichage, les Core Web Vitals, le rendu mobile, les contrastes, la navigation clavier, les liens cassés, robots.txt et l’indexation réelle ne sont pas testés. Les contrôles validés ne sont pas une note globale de qualité.',
  };
}
