export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t py-8 text-center text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p>&copy; {year} {process.env.NEXT_PUBLIC_APP_NAME ?? 'Glitrai'}. All rights reserved.</p>
      </div>
    </footer>
  );
}
