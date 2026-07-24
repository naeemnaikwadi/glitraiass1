import Link from 'next/link';

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="text-lg font-bold tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
        >
          {process.env.NEXT_PUBLIC_APP_NAME ?? 'Glitrai'}
        </Link>

        <nav aria-label="Main navigation">
          <ul className="flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-400">
            <li>
              <Link href="/" className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
                Home
              </Link>
            </li>
            {/* Add nav links here */}
          </ul>
        </nav>
      </div>
    </header>
  );
}
