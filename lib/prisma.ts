import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { Pool, neonConfig } from '@neondatabase/serverless';

// Use the built-in WebSocket (Node v22+) instead of the 'ws' package to avoid
// the native bufferUtil.mask incompatibility when running inside Next.js.
if (typeof WebSocket === 'undefined') {
  // Fallback for older Node versions — lazy-require to avoid the native addon issue
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  neonConfig.webSocketConstructor = require('ws');
} else {
  neonConfig.webSocketConstructor = WebSocket;
}

// ─── Singleton ────────────────────────────────────────────────────────────────

type GlobalWithPrisma = typeof globalThis & {
  _prismaPool:   Pool         | undefined;
  _prismaClient: PrismaClient | undefined;
};

const g = globalThis as GlobalWithPrisma;

function getPool(): Pool {
  if (!g._prismaPool) {
    g._prismaPool = new Pool({ connectionString: process.env.DATABASE_URL! });
  }
  return g._prismaPool;
}

function createPrismaClient(): PrismaClient {
  const adapter = new PrismaNeon(getPool());

  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === 'development'
        ? [{ emit: 'stdout', level: 'warn' }, { emit: 'stdout', level: 'error' }]
        : [{ emit: 'stdout', level: 'error' }],
  });
}

// Re-use across Next.js hot-reloads in development to avoid exhausting
// Neon's connection limit.
export const prisma: PrismaClient = g._prismaClient ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  g._prismaClient = prisma;
}
