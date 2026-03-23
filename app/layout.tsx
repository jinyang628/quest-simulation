import type { Metadata } from 'next';

import HeaderButtons from '@/components/shared/header/buttons';
import { ThemeProvider } from '@/components/shared/theme/provider';

import './globals.css';

export const metadata: Metadata = {
  title: 'Quest Simulation',
  description: 'Simulation of the board game Quest',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full antialiased">
      <body className="flex min-h-full flex-col" style={{ fontFamily: 'Arial, sans-serif' }}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="flex h-screen w-full min-w-120 flex-col p-8">
            <HeaderButtons />
            {children}
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
