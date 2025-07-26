import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/Navbar';
import { UndoToastManager } from '@/components/UndoToastManager';
import { OptimisticToastManager } from '@/components/OptimisticToastManager';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'JobFinder',
  description: 'Job search assistant with contact management',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-background">
          <Navbar />
          <main className="container mx-auto px-4 py-8">
            {children}
          </main>
          <UndoToastManager />
          <OptimisticToastManager />
        </div>
      </body>
    </html>
  );
} 