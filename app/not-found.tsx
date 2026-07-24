import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '404 — Page Not Found',
};

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 text-center">
      <h1 className="text-6xl font-bold">404</h1>
      <p className="mt-4 text-xl" style={{ color: 'var(--muted-foreground)' }}>
        Page not found
      </p>
      <Link
        href="/"
        className="mt-8 rounded-md px-5 py-2.5 text-sm font-medium transition-opacity hover:opacity-80 focus-visible:outline"
        style={{ background: 'var(--foreground)', color: 'var(--background)' }}
      >
        Back to home
      </Link>
    </main>
  );
}
