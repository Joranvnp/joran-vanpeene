# Joran Vanpeene — Portfolio

Portfolio personnel de **Joran Vanpeene**, développeur & designer web à Aigre (Charente, 16140).

**Stack :** Next.js 14 (App Router) · React 18 · TypeScript · next/font · Route Handlers Edge

---

## 🚀 Stack & décisions techniques

- **Framework** : Next.js 14 App Router — SEO optimal grâce au rendu côté serveur des métadonnées (title, OG, JSON-LD) et au code-splitting automatique
- **Polices** : `next/font` → pas de FOUT, pas de CLS, auto-hébergement des fonts (pas de requête à `fonts.googleapis.com`)
- **Images** : `public/` avec cache long terme (1 an, immutable)
- **Backend** : Route Handlers sur runtime Edge (< 50 ms de cold start) pour `/api/audit` (Claude) et `/api/brief` (Resend)
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
    audit/route.ts        ← Serverless — analyse IA via Anthropic
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
3. **Environment Variables** : ajouter les 3 variables du tableau ci-dessous
4. **Deploy** → le site sort sur `joran-vanpeene.vercel.app`

### Variables d'environnement (Vercel → Settings → Environment Variables)

| Clé | Où la trouver | Obligatoire |
|---|---|---|
| `ANTHROPIC_API_KEY` | [console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys) | ✅ |
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
- **Anthropic** : ~0.001 €/audit (Claude Haiku). 100 audits = 0,10 €

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
