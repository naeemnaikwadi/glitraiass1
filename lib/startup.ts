/**
 * Startup health checks — called from instrumentation.ts.
 * Prints a clean summary when `npm run dev` or `npm start` boots.
 */

const SEP = '─'.repeat(52);

function ok(label: string, note: string) {
  console.log(`  ✅  ${label.padEnd(18)} ${note}`);
}
function fail(label: string, note: string) {
  console.error(`  ❌  ${label.padEnd(18)} ${note}`);
}

// ─── Individual checks ────────────────────────────────────────────────────────

async function checkDatabase(): Promise<boolean> {
  try {
    const { prisma } = await import('@/lib/prisma');
    await prisma.$queryRaw`SELECT 1`;
    const count = await prisma.job.count();
    ok('Database', `PostgreSQL connected  (${count} jobs)`);
    return true;
  } catch (err) {
    fail('Database', `unreachable — ${(err as Error).message.split('\n')[0]}`);
    return false;
  }
}

async function checkGemini(): Promise<boolean> {
  try {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error('GEMINI_API_KEY not set');

    // Minimal ping: list models endpoint (no quota consumed)
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${key}&pageSize=1`,
    );
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const msg  = (body as { error?: { message?: string } }).error?.message ?? res.statusText;
      throw new Error(`${res.status} ${msg}`);
    }
    ok('Gemini API', 'reachable  (key valid)');
    return true;
  } catch (err) {
    fail('Gemini API', `${(err as Error).message}`);
    return false;
  }
}

async function checkPollinations(): Promise<boolean> {
  try {
    const res = await fetch('https://image.pollinations.ai', { method: 'HEAD', signal: AbortSignal.timeout(5000) });
    if (res.ok || res.status === 405) {
      ok('Pollinations AI', 'reachable');
      return true;
    }
    throw new Error(`HTTP ${res.status}`);
  } catch (err) {
    fail('Pollinations AI', `${(err as Error).message}`);
    return false;
  }
}

function checkEnv(): boolean {
  const required = ['DATABASE_URL', 'API_SECRET_KEY', 'GEMINI_API_KEY'];
  const missing  = required.filter((k) => !process.env[k]);
  if (missing.length) {
    fail('Environment', `missing: ${missing.join(', ')}`);
    return false;
  }
  ok('Environment', `all required vars present`);
  return true;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export async function checkStartup() {
  console.log(`\n${SEP}`);
  console.log('  🚀  Glitrai startup checks\n');

  const envOk  = checkEnv();
  const [dbOk, geminiOk, pollinationsOk] = await Promise.all([
    checkDatabase(),
    checkGemini(),
    checkPollinations(),
  ]);

  const all = [envOk, dbOk, geminiOk, pollinationsOk];
  const passed = all.filter(Boolean).length;

  console.log('');
  if (passed === all.length) {
    console.log(`  ✨  All systems ready  (${passed}/${all.length})`);
  } else {
    console.log(`  ⚠️   ${passed}/${all.length} checks passed — some features may not work`);
  }

  console.log(`${SEP}\n`);
}
