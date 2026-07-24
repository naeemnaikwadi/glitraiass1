/**
 * Next.js Instrumentation Hook
 * Runs once when the server starts (both dev and prod).
 * Checks DB and Gemini connectivity and prints a startup report.
 * https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  // Only run in the Node.js runtime (not edge), and only on the server
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;

  // Dynamic imports keep heavy modules out of the edge bundle
  const { checkStartup } = await import('@/lib/startup');
  await checkStartup();
}
