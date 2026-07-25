'use client';

import { useCallback, useEffect, useState } from 'react';
import { JobCard, JobCardSkeleton, type JobCardData } from './JobCard';
import { ActiveJobPoller } from './ActiveJobPoller';
import { useToast } from '@/components/ui/Toast';

type Props = {
  latestJobId: string | null;
  /** Called whenever the jobs list changes — used by parent for stats */
  onJobsChange?: (jobs: JobCardData[]) => void;
};

export function JobList({ latestJobId, onJobsChange }: Props) {
  const { toast }               = useToast();
  const [jobs, setJobs]         = useState<JobCardData[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  // ── Merge a polled update into the list ───────────────────────────────────
  const mergeJob = useCallback((updated: JobCardData) => {
    // Compute next state outside the setter so we can notify the parent
    // without calling setState inside another component's render phase.
    setJobs((prev) => prev.map((j) => (j.id === updated.id ? { ...j, ...updated } : j)));
    if (updated.status === 'completed') {
      toast(`"${updated.productName}" — image ready!`, 'success');
    } else if (updated.status === 'failed') {
      toast(`"${updated.productName}" — generation failed`, 'error');
    }
  }, [toast]);

  // ── Load full list ────────────────────────────────────────────────────────
  const loadJobs = useCallback(async () => {
    try {
      const res  = await fetch('/api/jobs', { cache: 'no-store' });
      const json = await res.json();
      if (json.success) {
        setJobs(json.data as JobCardData[]);
        setError(null);
      } else {
        setError(json.error ?? 'Failed to load jobs');
      }
    } catch {
      setError('Network error while loading jobs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadJobs(); }, [loadJobs]);

  useEffect(() => {
    if (latestJobId) loadJobs();
  }, [latestJobId, loadJobs]);

  // Notify parent whenever the jobs list changes (stats, etc.)
  // Using an effect keeps this outside the render phase.
  useEffect(() => {
    onJobsChange?.(jobs);
  }, [jobs]); // eslint-disable-line react-hooks/exhaustive-deps

  const activeJobs = jobs.filter(
    (j) => j.status === 'pending' || j.status === 'processing',
  );

  // ─── Render ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="Loading jobs">
        {[1, 2, 3].map((i) => <JobCardSkeleton key={i} />)}
      </div>
    );
  }

  if (error) {
    return (
      <div
        role="alert"
        className="rounded-lg bg-red-50 px-5 py-4 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400"
      >
        {error}
      </div>
    );
  }

  if (jobs.length === 0) {
    return <EmptyState />;
  }

  return (
    <>
      {activeJobs.map((job) => (
        <ActiveJobPoller key={job.id} jobId={job.id} onUpdate={mergeJob} />
      ))}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {jobs.map((job) => (
          <JobCard
            key={job.id}
            job={job}
            isActive={job.id === latestJobId}
          />
        ))}
      </div>
    </>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div
      role="status"
      aria-label="No generation jobs yet"
      className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 py-20 text-center dark:border-slate-700"
    >
      {/* Illustration */}
      <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
        <svg
          className="h-10 w-10 text-slate-300 dark:text-slate-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3 21h18M6.75 6.75h.008v.008H6.75V6.75z"
          />
        </svg>
      </div>
      <p className="text-base font-semibold text-slate-600 dark:text-slate-300">
        No generation jobs yet.
      </p>
      <p className="mt-1.5 max-w-xs text-sm text-slate-400 dark:text-slate-500">
        Fill in the form above and hit <span className="font-medium text-blue-600 dark:text-blue-400">Generate Image</span> to create your first cinematic product shot.
      </p>
    </div>
  );
}
