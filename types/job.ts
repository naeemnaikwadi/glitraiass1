import type { Job, JobStatus, Prisma } from '@prisma/client';

// Re-export the generated Prisma types so the rest of the app
// never imports from '@prisma/client' directly — only from here.
export type { Job, JobStatus };

// ─── Payload types ───────────────────────────────────────────────────────────

/** Fields required to create a new Job */
export type CreateJobInput = Prisma.JobCreateInput;

/** Fields allowed when updating a Job */
export type UpdateJobInput = Prisma.JobUpdateInput;

/** Prisma where filter for a single Job */
export type JobWhereUniqueInput = Prisma.JobWhereUniqueInput;

/** Prisma where filter for a Job list query */
export type JobWhereInput = Prisma.JobWhereInput;

/** Prisma orderBy for Job list queries */
export type JobOrderByInput = Prisma.JobOrderByWithRelationInput;

// ─── Convenience subsets ─────────────────────────────────────────────────────

/** Lightweight Job — just enough for list views */
export type JobSummary = Pick<
  Job,
  'id' | 'productName' | 'status' | 'createdAt'
>;

/** Full Job row returned from the database */
export type JobDetail = Job;
