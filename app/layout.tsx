import type { Metadata, Viewport } from 'next';
import { Inter, Inter_Tight, DM_Mono, Fraunces } from 'next/font/google';
import './globals.css';

// ───────────────────────── Fonts (next/font — zéro CLS, auto-optimized) ─────────────────────────
const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-inter',
  display: 'swap',
  preload: true,
});

const interTight = Inter_Tight({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-inter-tight',
  display: 'swap',
  preload: true,
});

const dmMono = DM_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-dm-mono',
  display: 'swap',
  preload: false,
});

const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  style: ['italic'],
  variable: '--font-fraunces',
  display: 'swap',
  preload: false,
});

// ───────────────────────── Metadata (Next.js Metadata API — SEO complet) ─────────────────────────
const SITE_URL = 'https://joran-vanpeene.fr';
const SITE_NAME = 'Joran Vanpeene';
const TITLE = 'Joran Vanpeene — Développeur & Designer Web à Aigre (16)';
const DESCRIPTION =
  'Développeur & designer web indépendant à Aigre (16140). Sites vitrines rapides, outils métier sur-mesure et interfaces soignées pour artisans, commerçants et marques indépendantes en Charente.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: '%s — Joran Vanpeene',
  },
  description: DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: 'Joran Vanpeene', url: SITE_URL }],
  creator: 'Joran Vanpeene',
  publisher: 'Joran Vanpeene',
  generator: 'Next.js',
  keywords: [
    'Développeur web Aigre',
    'Création site internet Charente',
    'Webmaster 16',
    'Site vitrine artisan',
    'Développeur freelance Angoulême',
    'Designer web Ruffec',
    'Développeur React Charente',
    'Création site e-commerce Cognac',
    'Joran Vanpeene',
  ],
  referrer: 'origin-when-cross-origin',
  alternates: {
    canonical: SITE_URL,
    languages: {
      'fr-FR': SITE_URL,
      'x-default': SITE_URL,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: SITE_URL,
    title: TITLE,
    description: DESCRIPTION,
    siteName: SITE_NAME,
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Joran Vanpeene — Développeur & Designer Web à Aigre (16)',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    images: ['/og-image.png'],
    creator: '@joranvanpeene',
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  manifest: '/site.webmanifest',
  category: 'technology',
  classification: 'Développement web, Design web, Freelance',
  other: {
    'geo.region': 'FR-NAQ',
    'geo.placename': 'Aigre, Charente',
    'geo.position': '45.8936;0.0097',
    ICBM: '45.8936, 0.0097',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#121212' },
    { media: '(prefers-color-scheme: light)', color: '#FAFAFA' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  colorScheme: 'dark light',
};

// ───────────────────────── JSON-LD Structured Data ─────────────────────────
const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Person',
      '@id': `${SITE_URL}/#person`,
      name: 'Joran Vanpeene',
      url: SITE_URL,
      jobTitle: 'Développeur & Designer Web',
      image: `${SITE_URL}/og-image.png`,
      sameAs: [
        'https://github.com/Joranvnp',
        'https://www.linkedin.com/in/joran-vanpeene/',
      ],
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Aigre',
        addressRegion: 'Nouvelle-Aquitaine',
        postalCode: '16140',
        addressCountry: 'FR',
      },
      knowsLanguage: ['fr-FR', 'en-US'],
      workLocation: {
        '@type': 'Place',
        name: 'Aigre, Charente',
      },
    },
    {
      '@type': ['LocalBusiness', 'ProfessionalService'],
      '@id': `${SITE_URL}/#business`,
      name: 'Joran Vanpeene — Développeur & Designer Web',
      image: `${SITE_URL}/og-image.png`,
      description:
        'Développeur et designer web indépendant à Aigre (16140). Création de sites vitrines, outils métier et interfaces sur-mesure pour artisans, commerçants et marques indépendantes en Charente.',
      priceRange: '€€',
      url: SITE_URL,
      founder: { '@id': `${SITE_URL}/#person` },
      areaServed: [
        'Aigre',
        'Ruffec',
        'Mansle',
        'Angoulême',
        'Cognac',
        'Charente',
        'Nouvelle-Aquitaine',
      ],
      knowsAbout: [
        'Développement web',
        'Design d\'interface',
        'Création de sites vitrines',
        'Outils métier sur-mesure',
        'React',
        'Next.js',
        'Référencement naturel',
      ],
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Aigre',
        addressRegion: 'Nouvelle-Aquitaine',
        postalCode: '16140',
        addressCountry: 'FR',
      },
      geo: {
        '@type': 'GeoCoordinates',
        latitude: 45.8936,
        longitude: 0.0097,
      },
      openingHoursSpecification: [
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
          opens: '09:00',
          closes: '18:00',
        },
      ],
      makesOffer: [
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Site vitrine',
            description: 'Création de sites vitrines rapides et soignés pour artisans et commerçants.',
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Outil métier sur-mesure',
            description: 'Développement d\'applications web métier adaptées à vos besoins.',
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Identité de marque',
            description: 'Design d\'identité visuelle cohérente et mémorable.',
          },
        },
      ],
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      description: DESCRIPTION,
      inLanguage: 'fr-FR',
      publisher: { '@id': `${SITE_URL}/#person` },
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="fr"
      className={`${inter.variable} ${interTight.variable} ${dmMono.variable} ${fraunces.variable}`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
