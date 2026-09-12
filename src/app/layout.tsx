import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as SonnerToaster } from '@/components/ui/sonner';
import { ThemeProvider } from '@/components/theme-provider';
import { Providers } from '@/components/providers';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'SensorGrid — IoT Device Intelligence Platform',
  description:
    'Connect. Observe. Automate. A professional IoT platform for realtime device telemetry, automation, and intelligence.',
  keywords: [
    'SensorGrid',
    'IoT',
    'device intelligence',
    'MQTT',
    'telemetry',
    'automation',
    'realtime dashboard',
  ],
  authors: [{ name: 'SensorGrid' }],
  icons: {
    icon: '/logo.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <Providers>
            {children}
            <Toaster />
            <SonnerToaster richColors closeButton position="bottom-right" />
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
