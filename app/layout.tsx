import type { Metadata } from 'next';
import './globals.css';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import Script from 'next/script';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://umfuturoproximo.vercel.app';
const adsenseId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || 'ca-pub-9812172654623216';
const gaId = process.env.NEXT_PUBLIC_GA_ID || 'G-KX51DSGRWD';
const gtmId = process.env.NEXT_PUBLIC_GTM_ID || 'GTM-56FTJNTJ';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Um Futuro Próximo | Notícias de Inteligência Artificial e Robôs Humanoides',
    template: '%s | Um Futuro Próximo',
  },
  description:
    'Portal de referência em Inteligência Artificial, Robôs Humanoides, Saúde, Computação Cognitiva e Tecnologias Emergentes. Editado por Riccardo Malfer.',
  keywords: [
    'Inteligência Artificial',
    'Robôs Humanoides',
    'IA Generativa',
    'Riccardo Malfer',
    'Modelos Gemma',
    'Ollama',
    'Tecnologia',
    'Futuro',
    'Biotecnologia',
    'Robótica Avançada',
  ],
  authors: [{ name: 'Riccardo Malfer', url: siteUrl }],
  creator: 'Riccardo Malfer',
  publisher: 'Um Futuro Próximo',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: siteUrl,
    siteName: 'Um Futuro Próximo',
    title: 'Um Futuro Próximo | O Futuro da Inteligência Artificial e Robótica',
    description:
      'Acompanhe os principais avanços em IA, robôs humanoides, pesquisas científicas e novas tecnologias que estão moldando o futuro.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Um Futuro Próximo | Riccardo Malfer',
    description:
      'Portal de notícias e análises sobre Inteligência Artificial e Robôs Humanoides.',
  },
  other: {
    'geo.region': 'BR-SP',
    'geo.placename': 'São Paulo, Brasil',
    'geo.position': '-23.5505;-46.6333',
    'ICBM': '-23.5505, -46.6333',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLdOrg = {
    '@context': 'https://schema.org',
    '@type': 'NewsMediaOrganization',
    name: 'Um Futuro Próximo',
    url: siteUrl,
    logo: `${siteUrl}/logo.png`,
    sameAs: ['https://twitter.com/rmalfer', 'https://linkedin.com/in/rmalfer'],
    founder: {
      '@type': 'Person',
      name: 'Riccardo Malfer',
      jobTitle: 'Editor-Chefe & Especialista em IA',
    },
  };

  return (
    <html lang="pt-BR">
      <head>
        {/* Schema.org Organization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdOrg) }}
        />

        {/* Google AdSense Script & Verification */}
        {adsenseId && !adsenseId.includes('0000000000') && (
          <>
            <meta name="google-adsense-account" content={adsenseId} />
            <script
              async
              src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseId}`}
              crossOrigin="anonymous"
            />
          </>
        )}
        {/* Google Tag Manager Script */}
        {gtmId && !gtmId.includes('00000000') && (
          <Script id="google-tag-manager" strategy="afterInteractive">
            {`
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','${gtmId}');
            `}
          </Script>
        )}
      </head>
      <body className="min-h-screen flex flex-col bg-white">
        {/* Google Tag Manager (noscript) */}
        {gtmId && !gtmId.includes('00000000') && (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
              height="0"
              width="0"
              style={{ display: 'none', visibility: 'hidden' }}
            />
          </noscript>
        )}
        {/* Google Analytics 4 (gerenciado via GTM; fallback caso GTM não esteja ativo) */}
        {!gtmId && gaId && !gaId.includes('0000000000') && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaId}');
              `}
            </Script>
          </>
        )}

        <Header />
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-8 py-8">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
