/**
 * Job Service — orchestrates repository + pipeline, used by route handlers.
 * Throws AppError subclasses; routes catch them via withHandler().
 */

import { createJob, findAllJobs, findJobByIdOrThrow } from '@/lib/repositories/job.repository';
import { runGenerationPipeline } from '@/lib/services/pipeline.service';
import { logger } from '@/lib/logger';
import type { GenerateJobBody } from '@/lib/validation/job.validation';
import type { Job } from '@/types/job';

const CTX = 'JobService';

// ─── Operations ───────────────────────────────────────────────────────────────

/**
 * Create a job (DB write only) and fire the async pipeline.
 * Returns immediately — does NOT block on generation.
 */
export async function initiateGenerateJob(
  input: GenerateJobBody,
): Promise<Pick<Job, 'id' | 'status' | 'createdAt'>> {
  const job = await createJob(input);

  logger.info(`Job created, pipeline starting`, CTX, { jobId: job.id });

  // Fire-and-forget — pipeline handles its own errors internally
  runGenerationPipeline(job.id);

  return { id: job.id, status: job.status, createdAt: job.createdAt };
}

/**
 * Return a job's current status (for polling).
 * Throws NotFoundError (→ 404) if the job doesn't exist.
 */
export async function getJobStatus(
  id: string,
): Promise<Pick<Job, 'id' | 'status' | 'generatedPrompt' | 'generatedImage' | 'createdAt' | 'updatedAt'>> {
  const job = await findJobByIdOrThrow(id);

  return {
    id:              job.id,
    status:          job.status,
    generatedPrompt: job.generatedPrompt,
    generatedImage:  job.generatedImage,
    createdAt:       job.createdAt,
    updatedAt:       job.updatedAt,
  };
}

/**
 * Return all jobs ordered by most recent first.
 */
export async function getAllJobs(): Promise<Job[]> {
  return findAllJobs();
}
