'use client';

import { useCallback, useEffect, useRef } from 'react';
import type { JobCardData } from '@/components/jobs/JobCard';

const POLL_INTERVAL_MS = 3000;
const TERMINAL_STATUSES = new Set(['completed', 'failed']);

type Options = {
  jobId: string;
  /** Called with fresh data on every successful poll tick. */
  onUpdate: (job: JobCardData) => void;
  /** Called once when the job reaches a terminal status. */
  onDone?: (job: JobCardData) => void;
};

/**
 * useJobPoller
 *
 * Starts polling GET /api/jobs/:id every 3 s as soon as the hook mounts.
 * Automatically stops when status becomes "completed" or "failed".
 * Cleans up the timer on unmount.
 */
export function useJobPoller({ jobId, onUpdate, onDone }: Options) {
  // Store callbacks in refs so the interval closure always sees the latest
  // version without needing to re-register the interval.
  const onUpdateRef = useRef(onUpdate);
  const onDoneRef   = useRef(onDone);
  useEffect(() => { onUpdateRef.current = onUpdate; }, [onUpdate]);
  useEffect(() => { onDoneRef.current   = onDone;   }, [onDone]);

  const activeRef = useRef(true); // flip to false to stop polling

  const poll = useCallback(async () => {
    if (!activeRef.current) return;

    try {
      const res  = await fetch(`/api/jobs/${jobId}`, { cache: 'no-store' });
      const json = await res.json();

      if (!json.success || !activeRef.current) return;

      const job = json.data as JobCardData;
      onUpdateRef.current(job);

      if (TERMINAL_STATUSES.has(job.status)) {
        activeRef.current = false;           // stop future ticks
        onDoneRef.current?.(job);
        return;
      }

      // Schedule next tick only if still active
      if (activeRef.current) {
        setTimeout(poll, POLL_INTERVAL_MS);
      }
    } catch {
      // Network hiccup — retry on next tick if still active
      if (activeRef.current) {
        setTimeout(poll, POLL_INTERVAL_MS);
      }
    }
  }, [jobId]); // jobId is stable per hook instance

  useEffect(() => {
    activeRef.current = true;
    const timer = setTimeout(poll, POLL_INTERVAL_MS); // first tick after 3 s

    return () => {
      activeRef.current = false;
      clearTimeout(timer);
    };
  }, [poll]);
}
