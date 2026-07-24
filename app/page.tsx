import type { Metadata } from 'next';
import Link from 'next/link';
import { GeneratePageClient } from '@/components/generate/GeneratePageClient';

export const metadata: Metadata = {
  title: 'Generate',
  description: 'Generate cinematic AI product images with Glitrai.',
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">

      {/* ── Navigation ──────────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-950/80"
        role="banner"
      >
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link
            href="/"
            className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
            aria-label="Glitrai home"
          >
            glitrai
          </Link>
          <div className="flex items-center gap-3">
            <span
              className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
              aria-label="AI Image Generator"
            >
              AI Image Generator
            </span>
          </div>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <div className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl md:text-4xl">
            Product Image Generator
          </h1>
          <p className="mt-2 max-w-xl text-sm text-slate-500 dark:text-slate-400 sm:text-base">
            Describe your product and get a cinematic, high-quality AI-generated image in seconds.
          </p>
        </div>
      </div>

      {/* ── Main content ────────────────────────────────────────────────── */}
      <main
        id="main-content"
        className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8"
        tabIndex={-1}
      >
        <GeneratePageClient />
      </main>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer
        className="border-t border-slate-200 py-8 text-center text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400"
        role="contentinfo"
      >
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <p>&copy; {new Date().getFullYear()} Glitrai. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
