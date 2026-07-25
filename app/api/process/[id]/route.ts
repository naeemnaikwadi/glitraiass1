import type { NextRequest } from 'next/server';
import { apiSuccess, apiError, withHandler, type RouteContext } from '@/lib/api-response';
import { runGenerationPipeline } from '@/lib/services/pipeline.service';
import { findJobByIdOrThrow } from '@/lib/repositories/job.repository';
import { logger } from '@/lib/logger';

const CTX = 'POST /api/process/[id]';

/**
 * POST /api/process/:id
 *
 * Triggers the generation pipeline for an existing pending job.
 * Safe to call multiple times — the pipeline is idempotent and skips
 * jobs that are already processing, completed, or failed.
 *
 * This endpoint exists to make background processing reliable on
 * Vercel Serverless, where fire-and-forget execution is not guaranteed.
 * The frontend calls this immediately after POST /api/generate returns.
 */
export const POST = withHandler(async (
  _req: NextRequest,
  ctx: RouteContext<{ id: string }>,
) => {
  const { id } = await ctx.params;

  if (!id?.trim()) {
    return apiError('Job id is required', 400, undefined, 'VALIDATION_ERROR');
  }

  const jobId = id.trim();

  // Verify the job exists before starting the pipeline
  const job = await findJobByIdOrThrow(jobId);

  // Already past pending — return early without re-running
  if (job.status === 'completed' || job.status === 'failed') {
    logger.info(`Process skipped — job already ${job.status}`, CTX, { jobId });
    return apiSuccess({ jobId, status: job.status }, 'Job already processed');
  }

  logger.info('Job processing started', CTX, { jobId });

  // Run the pipeline synchronously within the request lifetime.
  // On Vercel this keeps execution alive for the full duration.
  await runGenerationPipeline(jobId);

  logger.info('Job processing finished', CTX, { jobId });

  return apiSuccess({ jobId }, 'Job processed successfully');
});
