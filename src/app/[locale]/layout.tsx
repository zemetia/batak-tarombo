import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import '../globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/toaster';
import { Header } from '@/components/layout/header';
import { verificationSession } from '@/lib/auth/session';
import { AuthProvider } from '@/components/auth/auth-provider';

export async function generateMetadata(props: {params: Promise<{locale: string}>}) {
  const params = await props.params;
  const { locale } = params;
  const t = await getTranslations({locale, namespace: 'Layout'});

  return {
    title: t('title'),
    description: t('description'),
    icons: {
      icon: [
        { url: '/images/icons/logo_tarombo_batak.png', sizes: '32x32', type: 'image/png' },
        { url: '/images/icons/logo_tarombo_batak.png', sizes: '16x16', type: 'image/png' },
      ],
      apple: { url: '/images/icons/logo_tarombo_batak.png', sizes: '180x180', type: 'image/png' },
      shortcut: '/images/icons/logo_tarombo_batak.png',
    }
  };
}

export default async function RootLayout(props: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const params = await props.params;
  const { locale } = params;
  const children = props.children;
  const messages = await getMessages();
  const session = await verificationSession();

  return (
    <html lang={locale} className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=PT+Sans:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body
        className={cn(
          'h-full bg-background font-body text-foreground antialiased'
        )}
      >
        <NextIntlClientProvider messages={messages}>
          <AuthProvider initialUser={session?.user || null}>
            <div className="relative flex min-h-screen flex-col">
              <Header />
              <main className="flex-1">{children}</main>
            </div>
            <Toaster />
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
