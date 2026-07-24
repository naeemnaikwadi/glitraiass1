import type { NextRequest } from 'next/server';
import { apiSuccess, withHandler, type RouteContext } from '@/lib/api-response';
import { getAllJobs } from '@/lib/services/job.service';

/**
 * GET /api/jobs
 * Returns all jobs ordered by most recent first.
 */
export const GET = withHandler(async (_req: NextRequest, _ctx: RouteContext) => {
  const jobs = await getAllJobs();
  return apiSuccess(jobs);
});
