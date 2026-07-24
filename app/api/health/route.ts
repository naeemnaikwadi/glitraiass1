import { apiSuccess } from '@/lib/api-response';

/**
 * GET /api/health
 *
 * Lightweight liveness probe — no database check intentionally.
 * Add a /api/health/ready route if you need a readiness probe with DB ping.
 *
 * Responses:
 *   200 – { success: true, data: { status: "ok", timestamp, environment } }
 */
export async function GET() {
  return apiSuccess({
    status: 'ok' as const,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
}
