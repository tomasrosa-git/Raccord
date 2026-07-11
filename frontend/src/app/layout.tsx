import type { Metadata } from 'next';
import { Piazzolla, Work_Sans, IBM_Plex_Mono } from 'next/font/google';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { AuthProvider } from '@/lib/hooks/useAuth';
import './globals.css';

const piazzolla = Piazzolla({
  subsets: ['latin'],
  variable: '--font-piazzolla',
  display: 'swap',
});

const workSans = Work_Sans({
  subsets: ['latin'],
  variable: '--font-work-sans',
  display: 'swap',
});

const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-plex-mono',
  display: 'swap',
});

const DESCRIPCION =
  'Plataforma sobre cine de autor con el director como eje: filmografías, colaboradores frecuentes y la firma visual de cada cineasta.';

export const metadata: Metadata = {
  metadataBase: new URL('https://raccord.com.ar'),
  title: {
    default: 'Raccord — cine de autor',
    template: '%s · Raccord',
  },
  description: DESCRIPCION,
  openGraph: {
    type: 'website',
    siteName: 'Raccord',
    title: 'Raccord — cine de autor',
    description: DESCRIPCION,
    url: 'https://raccord.com.ar',
    locale: 'es_AR',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Raccord — cine de autor',
    description: DESCRIPCION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${piazzolla.variable} ${workSans.variable} ${plexMono.variable} h-full scroll-smooth antialiased`}
    >
      <body className="flex min-h-dvh flex-col">
        <AuthProvider>
          <Header />
          <main className="flex flex-1 flex-col">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
