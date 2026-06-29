import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'Org Chart — Perago',
  description: 'Organizational hierarchy management',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen font-sans antialiased">
        <Providers>
          <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-6">
            <header className="flex items-center justify-between border-b border-line py-6">
              <a href="/" className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-accent font-mono text-xs font-semibold text-white">
                  O
                </span>
                <span className="text-[15px] font-semibold tracking-tight">
                  Org Chart
                </span>
              </a>
              <span className="font-mono text-xs text-ink/40">
                positions API
              </span>
            </header>
            <main className="flex-1 py-8">{children}</main>
            <footer className="border-t border-line py-6 text-xs text-ink/40">
              Adjacency list + recursive CTE under the hood. No tree-table
              library required.
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
