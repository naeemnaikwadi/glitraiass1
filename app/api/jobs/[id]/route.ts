import type { NextRequest } from 'next/server';
import { apiSuccess, withHandler, type RouteContext } from '@/lib/api-response';
import { getJobStatus } from '@/lib/services/job.service';
import { ValidationError } from '@/lib/errors';

/**
 * GET /api/jobs/:id
 * Returns current job state — poll this after POST /api/generate.
 */
export const GET = withHandler(async (
  _req: NextRequest,
  ctx: RouteContext<{ id: string }>,
) => {
  const { id } = await ctx.params;

  if (!id?.trim()) {
    throw new ValidationError('Job id is required');
  }

  const job = await getJobStatus(id.trim());
  return apiSuccess(job);
});
