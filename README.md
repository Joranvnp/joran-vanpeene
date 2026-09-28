# Joran Vanpeene — Portfolio

Portfolio personnel de **Joran Vanpeene**, développeur & designer web à Aigre (Charente, 16140).

**Stack :** Next.js 14 (App Router) · React 18 · TypeScript · next/font · Route Handlers Node.js / Edge

---

## 🚀 Stack & décisions techniques

- **Framework** : Next.js 14 App Router — SEO optimal grâce au rendu côté serveur des métadonnées (title, OG, JSON-LD) et au code-splitting automatique
- **Polices** : `next/font` → pas de FOUT, pas de CLS, auto-hébergement des fonts (pas de requête à `fonts.googleapis.com`)
- **Images** : `public/` avec cache long terme (1 an, immutable)
- **Backend** : `/api/audit` sur Node.js (lecture HTML réelle, sans IA) et `/api/brief` sur Edge (Resend)
- **SEO** : Metadata API, sitemap dynamique, robots.txt dynamique, JSON-LD (Person + LocalBusiness + WebSite + Services)
- **Accessibilité** : structure sémantique, focus visibles, `prefers-reduced-motion` respecté

---

## 📁 Structure

```
app/
  layout.tsx              ← Metadata API complète + JSON-LD + next/font
  page.tsx                ← Entry point (importe App)
  globals.css             ← Styles globaux
  sitemap.ts              ← Sitemap dynamique
  robots.ts               ← robots.txt dynamique
  components/
    App.tsx               ← Composant principal (client)
  api/
    audit/route.ts        ← Node.js — lecture de page et contrôles HTML
    brief/route.ts        ← Serverless — envoi email via Resend
public/
  favicon.svg             ← Favicon custom (monogramme JV)
  favicon-{32,192,512}.png
  apple-touch-icon.png
  og-image.png            ← 1200×630 pour partages sociaux
  site.webmanifest        ← PWA manifest
  humans.txt
  .well-known/security.txt
```

---

## 🔧 Installation & développement local

**Prérequis :** Node.js ≥ 18.17

```bash
# 1. Cloner le repo
git clone https://github.com/Joranvnp/joran-vanpeene.git
cd joran-vanpeene

# 2. Installer les dépendances
npm install

# 3. Copier les variables d'environnement
cp .env.example .env.local
# puis éditer .env.local avec tes vraies clés

# 4. Lancer le dev server
npm run dev
# → http://localhost:3000
```

---

## 🌍 Déploiement sur Vercel

### Première fois : push sur GitHub + connexion Vercel

```bash
# Depuis le dossier du projet
git init
git add .
git commit -m "Initial commit — portfolio Next.js"
git branch -M main
git remote add origin https://github.com/Joranvnp/joran-vanpeene.git
git push -u origin main
```

Puis sur [vercel.com](https://vercel.com) :
1. **Add New Project** → sélectionner le repo `joran-vanpeene`
2. **Framework Preset** : Next.js (détecté automatiquement)
3. **Environment Variables** : configurer les variables du formulaire de contact ci-dessous
4. **Deploy** → le site sort sur `joran-vanpeene.vercel.app`

### Variables d'environnement (Vercel → Settings → Environment Variables)

| Clé | Où la trouver | Obligatoire |
|---|---|---|
| `RESEND_API_KEY` | [resend.com/api-keys](https://resend.com/api-keys) | ✅ |
| `CONTACT_EMAIL` | `joran.vanpeene@gmail.com` | ✅ |
| `ANTHROPIC_MODEL` | défaut `claude-haiku-4-5` | Optionnel |
| `FROM_EMAIL` | `contact@joran-vanpeene.fr` une fois le domaine vérifié sur Resend | Optionnel |

### Brancher le domaine `joran-vanpeene.fr`

Vercel → Project → **Settings** → **Domains** → Add `joran-vanpeene.fr`.

Vercel t'indique les DNS à mettre chez ton registrar :
- `A` record : `76.76.21.21` pour le domaine racine
- `CNAME` pour `www` → `cname.vercel-dns.com`

Propagation DNS : 5-30 min. Certificat HTTPS automatique.

---

## 🔍 SEO — que se passe-t-il en remplaçant l'ancien site ?

**Le domaine `joran-vanpeene.fr` conserve toute son autorité** tant que le domaine reste le même.

- ✅ Backlinks préservés, autorité de domaine préservée
- ✅ Google recrawl automatiquement sous quelques jours
- ✅ Tu restes référencé sur "Joran Vanpeene" — **mieux qu'avant**, car le nouveau site a bien plus de contenu indexable
- ⏱️ Délai pour que tout l'index Google soit mis à jour : **1 à 4 semaines**

**Pour accélérer** : ajoute le site à [Google Search Console](https://search.google.com/search-console) et demande une réindexation manuelle après le premier déploiement.

### SEO — améliorations par rapport à la waiting page

| Élément | Waiting page | Ce portfolio |
|---|---|---|
| Title + meta description | ✅ | ✅ Metadata API (server-rendered) |
| Open Graph 1200×630 | ✅ image externe | ✅ image custom hébergée |
| Twitter Card | ✅ | ✅ |
| robots.txt | ✅ | ✅ dynamique + bloque `/api/` |
| sitemap.xml | 1 URL | **7 URLs** (home + 6 sections), généré à la build |
| JSON-LD LocalBusiness | ✅ basique | ✅ **Person + LocalBusiness + WebSite + Offers** (graph complet) |
| Favicon | ✅ | ✅ **custom JV** (SVG + 3 PNG + apple-touch) |
| PWA manifest | ❌ | ✅ |
| Geo tags (geo.region, ICBM) | ❌ | ✅ |
| hreflang | ❌ | ✅ `fr-FR` + `x-default` |
| humans.txt | ❌ | ✅ |
| security.txt | ❌ | ✅ |
| Optimisation polices (zéro CLS) | ⚠️ Google CDN | ✅ `next/font` self-hosted |
| SSR / pré-rendu HTML | ❌ SPA Vite | ✅ Next.js App Router |

---

## 🛠 Coûts mensuels estimés

- **Vercel** : gratuit (Hobby plan largement suffisant)
- **Resend** : gratuit jusqu'à 100 emails/jour
- **Diagnostic** : aucun appel à un fournisseur IA ; consommation réseau et fonctions Vercel selon le trafic.

**Total réaliste : 0 € à 2 € / mois** selon le trafic.

---

## 📝 Scripts npm

```bash
npm run dev      # dev server à localhost:3000
npm run build    # build de production
npm start        # serve la build (après `build`)
npm run lint     # lint Next.js
```

---

© 2026 Joran Vanpeene — conçu & codé à la main · Aigre (16), France

## Diagnostic HTML réel

`POST /api/audit` reçoit `{ "url": "https://exemple.fr" }`. Le serveur consulte une seule page publique et analyse son HTML avec Cheerio. Aucun appel Anthropic, aucune clé IA nécessaire.

Dix contrôles : HTTPS, title, meta description, H1, langue, viewport, canonique, directives noindex, attributs alt des images et libellés des liens. Le résultat contient les constats et jusqu’à trois actions, issues des contrôles à examiner. Le compteur affiche les contrôles validés parmi les contrôles évaluables ; ce n’est ni un score SEO ni une certification d’accessibilité. Les contrôles informatifs / non applicables sont exclus du dénominateur.

Limites affichées : pas d’exécution JavaScript, de mesure Lighthouse / Core Web Vitals, de test du rendu mobile, des contrastes, du clavier, des liens cassés, de robots.txt ou de l’indexation effective. Un site bloqué, non HTML, trop volumineux ou inaccessible produit une erreur explicite, jamais une analyse inventée.

Protection des requêtes : HTTP(S) uniquement, ports standards, pas d’identifiants ; résolution DNS validée et adresse épinglée pour éviter le rebinding ; rejet des réseaux privés/réservés à chaque redirection ; quatre redirections maximum ; délai total de 18 secondes ; HTML limité à 2 Mio avant et après décompression. Limitation mémoire par instance (10 demandes/minute/IP, 4 analyses simultanées), non distribuée. Aucun historique de diagnostic n’est enregistré par le code ; les journaux de l’hébergeur restent soumis à sa configuration. L’adresse est reçue par le serveur et le site cible reçoit la consultation.

Vérification : `npm test`, `npx tsc --noEmit`, `npm run build`. Les tests couvrent les constats, le HTML partiel, les erreurs anti-robot et les protections contre l’accès aux réseaux privés et les redirections.
