/**
 * Job Repository — sole owner of all DB access for the Job model.
 * Never imported by route handlers directly; go through services.
 */

import { prisma } from '@/lib/prisma';
import { AppError, NotFoundError, toError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import type { Job, JobStatus } from '@/types/job';
import type { GenerateJobBody } from '@/lib/validation/job.validation';

const CTX = 'JobRepository';

// ─── Read ─────────────────────────────────────────────────────────────────────

export async function findJobById(id: string): Promise<Job | null> {
  try {
    return await prisma.job.findUnique({ where: { id } });
  } catch (err) {
    logger.error('findJobById failed', CTX, err, { id });
    throw new AppError('Failed to fetch job', 500, 'DB_ERROR');
  }
}

export async function findJobByIdOrThrow(id: string): Promise<Job> {
  const job = await findJobById(id);
  if (!job) throw new NotFoundError('Job', id);
  return job;
}

export async function findAllJobs(): Promise<Job[]> {
  try {
    return await prisma.job.findMany({ orderBy: { createdAt: 'desc' } });
  } catch (err) {
    logger.error('findAllJobs failed', CTX, err);
    throw new AppError('Failed to fetch jobs', 500, 'DB_ERROR');
  }
}

// ─── Write ────────────────────────────────────────────────────────────────────

export async function createJob(input: GenerateJobBody): Promise<Job> {
  try {
    return await prisma.job.create({
      data: {
        productName:    input.productName,
        description:    input.description,
        referenceImage: input.referenceImage,
      },
    });
  } catch (err) {
    logger.error('createJob failed', CTX, err, { productName: input.productName });
    throw new AppError('Failed to create job', 500, 'DB_ERROR');
  }
}

export async function updateJob(
  id: string,
  data: { status?: JobStatus; generatedPrompt?: string; generatedImage?: string },
): Promise<Job> {
  try {
    return await prisma.job.update({ where: { id }, data });
  } catch (err) {
    // P2025 = record not found
    const raw = toError(err) as { code?: string };
    if (raw.code === 'P2025') throw new NotFoundError('Job', id);
    logger.error('updateJob failed', CTX, err, { id, data });
    throw new AppError('Failed to update job', 500, 'DB_ERROR');
  }
}
