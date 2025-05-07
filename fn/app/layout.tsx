import './globals.css';
import { Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import Providers from './providers';
import AppHeader from './components/AppHeader';
import AppFooter from './components/AppFooter';
import Head from 'next/head';

const inter = Inter({ subsets: ['latin'], display: 'swap' });

export const metadata = {
  title: 'Book Library - Your Ultimate Reading Destination',
  description: 'Find and purchase books from our vast collection of literature',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-white font-fallback`} suppressHydrationWarning>
        <Providers>
          <div className="flex flex-col min-h-screen">
            <AppHeader />
            <main className="flex-grow content-fix">{children}</main>
            <AppFooter />
          </div>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#363636',
                color: '#fff',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
              },
              success: {
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
