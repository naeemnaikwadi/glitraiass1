'use client';

import { useJobPoller } from '@/hooks/useJobPoller';
import type { JobCardData } from './JobCard';

type Props = {
  jobId: string;
  onUpdate: (job: JobCardData) => void;
};

/**
 * Renderless component.
 * Mounts a useJobPoller for one job. When the job reaches a terminal
 * status the poller stops and this component's job is done.
 * JobList renders one of these per active (pending/processing) job.
 */
export function ActiveJobPoller({ jobId, onUpdate }: Props) {
  useJobPoller({ jobId, onUpdate });
  return null;
}
