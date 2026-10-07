import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Sidebar } from '@/components/dashboard/sidebar';
import { MobileNav } from '@/components/dashboard/mobile-nav';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from '@/components/theme-provider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'āprən — Hotel Revenue Intelligence',
  description: 'Sell your hotel inventory more intelligently and more profitably.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light">
          <div className="flex min-h-screen bg-slate-50">
            <Sidebar />
            <main className="flex-1 pb-16 md:pb-0">{children}</main>
          </div>
          <MobileNav />
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
