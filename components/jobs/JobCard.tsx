'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Badge, Button } from '@/components/ui';
import { Card, CardContent, CardFooter } from '@/components/ui';
import type { JobStatus } from '@/types/job';
import { cn } from '@/utils/cn';

// ─── Types ────────────────────────────────────────────────────────────────────

export type JobCardData = {
  id: string;
  productName: string;
  status: JobStatus;
  createdAt: string | Date;
  referenceImage?: string | null;
  generatedImage?: string | null;
  generatedPrompt?: string | null;
};

// ─── Status meta ──────────────────────────────────────────────────────────────

type StatusMeta = {
  badge: 'default' | 'info' | 'success' | 'danger' | 'warning';
  label: string;
  pulse: boolean;
  ring: string;
  bar: string;
  hint: string;
};

const STATUS: Record<JobStatus, StatusMeta> = {
  pending: {
    badge: 'default',
    label: 'Pending',
    pulse: true,
    ring: 'ring-slate-300  dark:ring-slate-600',
    bar:  'bg-slate-300',
    hint: 'Waiting in queue…',
  },
  processing: {
    badge: 'info',
    label: 'Processing',
    pulse: true,
    ring: 'ring-blue-400   dark:ring-blue-500',
    bar:  'bg-blue-400',
    hint: 'Generating your image…',
  },
  completed: {
    badge: 'success',
    label: 'Completed',
    pulse: false,
    ring: 'ring-emerald-400 dark:ring-emerald-500',
    bar:  '',
    hint: '',
  },
  failed: {
    badge: 'danger',
    label: 'Failed',
    pulse: false,
    ring: 'ring-red-300    dark:ring-red-500',
    bar:  '',
    hint: '',
  },
};

// ─── Timeline steps ───────────────────────────────────────────────────────────

type TimelineStep = {
  key: string;
  label: string;
  /** which statuses count as "reached" for this step */
  reachedAt: JobStatus[];
  /** which statuses make this the *active* step */
  activeAt: JobStatus[];
};

const TIMELINE_STEPS: TimelineStep[] = [
  {
    key:       'pending',
    label:     'Pending',
    reachedAt: ['pending', 'processing', 'completed', 'failed'],
    activeAt:  ['pending'],
  },
  {
    key:       'processing',
    label:     'Processing',
    reachedAt: ['processing', 'completed', 'failed'],
    activeAt:  ['processing'],
  },
  {
    key:       'prompt',
    label:     'Prompt Generated',
    reachedAt: ['completed'],
    activeAt:  [],
  },
  {
    key:       'image',
    label:     'Image Generated',
    reachedAt: ['completed'],
    activeAt:  [],
  },
  {
    key:       'completed',
    label:     'Completed',
    reachedAt: ['completed'],
    activeAt:  ['completed'],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(d);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function JobTimeline({ status }: { status: JobStatus }) {
  const isFailed = status === 'failed';

  return (
    <div aria-label="Job progress timeline" className="mt-3">
      <ol className="flex items-center gap-0">
        {TIMELINE_STEPS.map((step, idx) => {
          const reached = step.reachedAt.includes(status);
          const active  = step.activeAt.includes(status);
          const isLast  = idx === TIMELINE_STEPS.length - 1;

          return (
            <li key={step.key} className="flex flex-1 items-center last:flex-none">
              {/* Step dot */}
              <div className="flex flex-col items-center">
                <div
                  aria-current={active ? 'step' : undefined}
                  className={cn(
                    'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold transition-all',
                    reached && !isFailed
                      ? 'border-blue-500 bg-blue-500 text-white dark:border-blue-400 dark:bg-blue-400'
                      : isFailed && step.reachedAt.includes('processing')
                      ? 'border-red-400 bg-red-400 text-white dark:border-red-500 dark:bg-red-500'
                      : 'border-slate-200 bg-white text-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-600',
                    active && !isFailed && 'ring-2 ring-blue-300 ring-offset-1 dark:ring-blue-600',
                  )}
                >
                  {reached && !isFailed ? (
                    active ? (
                      <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
                    ) : (
                      <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )
                  ) : null}
                </div>
                {/* Label below dot */}
                <span
                  className={cn(
                    'mt-1 hidden text-[9px] font-medium text-center leading-tight sm:block',
                    reached && !isFailed
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-slate-400 dark:text-slate-600',
                    active && !isFailed && 'font-semibold',
                  )}
                  style={{ maxWidth: '52px', wordBreak: 'break-word' }}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector line */}
              {!isLast && (
                <div
                  className={cn(
                    'h-0.5 flex-1 transition-all',
                    reached && !isFailed
                      ? 'bg-blue-400 dark:bg-blue-500'
                      : 'bg-slate-200 dark:bg-slate-700',
                  )}
                  aria-hidden="true"
                />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function ImagePanel({ src, alt, label }: { src: string; alt: string; label: string }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
      <div className="bg-slate-50 px-3 py-1.5 dark:bg-slate-800/60">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
          {label}
        </p>
      </div>
      <div className="relative h-48 w-full bg-slate-100 dark:bg-slate-800">
        {!loaded && (
          <div
            className="absolute inset-0 flex items-center justify-center"
            aria-label="Loading image"
          >
            <svg className="h-6 w-6 animate-spin text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        )}
        <Image
          src={src}
          alt={alt}
          fill
          className={cn('object-cover transition-opacity duration-300', loaded ? 'opacity-100' : 'opacity-0')}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          unoptimized
          onLoad={() => setLoaded(true)}
        />
      </div>
    </div>
  );
}

function PromptViewer({ prompt }: { prompt: string }) {
  const [open, setOpen] = useState(false);
  const id = `prompt-${prompt.slice(0, 8).replace(/\s/g, '')}`;

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={id}
        className={cn(
          'flex w-full items-center justify-between bg-slate-50 px-3 py-2 text-left',
          'dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800',
          'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
        )}
      >
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
          Prompt Used
        </p>
        <svg
          className={cn(
            'h-3.5 w-3.5 text-slate-400 transition-transform duration-200',
            open && 'rotate-180',
          )}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div id={id} className="px-3 py-3">
          <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300 whitespace-pre-wrap">
            {prompt}
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

export function JobCardSkeleton() {
  return (
    <div
      className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900 space-y-3 animate-pulse"
      aria-busy="true"
      aria-label="Loading job"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2 flex-1">
          <div className="h-4 w-3/4 rounded bg-slate-200 dark:bg-slate-700" />
          <div className="h-3 w-1/2 rounded bg-slate-100 dark:bg-slate-800" />
        </div>
        <div className="h-5 w-20 rounded-full bg-slate-200 dark:bg-slate-700" />
      </div>
      <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800" />
      <div className="h-3 w-1/3 rounded bg-slate-100 dark:bg-slate-800" />
    </div>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────

type Props = { job: JobCardData; isActive?: boolean };

export function JobCard({ job, isActive = false }: Props) {
  const [showResult, setShowResult] = useState(false);
  const meta         = STATUS[job.status];
  const isCompleted  = job.status === 'completed';
  const isFailed     = job.status === 'failed';
  const isInProgress = job.status === 'pending' || job.status === 'processing';
  const cardId       = `job-card-${job.id}`;

  return (
    <article
      id={cardId}
      aria-label={`Job: ${job.productName}, status: ${meta.label}`}
    >
      <Card
        className={[
          'transition-all duration-500',
          isActive || isInProgress ? `ring-2 ${meta.ring}` : '',
          isCompleted              ? `ring-2 ${meta.ring}` : '',
        ].filter(Boolean).join(' ')}
      >
        <CardContent className="space-y-3">

          {/* ── Header ──────────────────────────────────────────────────── */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate font-semibold text-slate-900 dark:text-slate-100">
                {job.productName}
              </h3>
              <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
                <time dateTime={new Date(job.createdAt).toISOString()}>
                  {formatTime(job.createdAt)}
                </time>
              </p>
            </div>

            <Badge variant={meta.badge} className="shrink-0 gap-1.5 items-center">
              {meta.pulse && (
                <span
                  className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-current"
                  aria-hidden="true"
                />
              )}
              {meta.label}
            </Badge>
          </div>

          {/* ── Job Timeline ────────────────────────────────────────────── */}
          <JobTimeline status={job.status} />

          {/* ── Progress bar (active jobs only) ─────────────────────────── */}
          {isInProgress && (
            <div className="space-y-1.5" role="status" aria-label={meta.hint}>
              <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className={`absolute inset-y-0 left-0 w-1/2 rounded-full ${meta.bar}`}
                  style={{ animation: 'shimmer 1.6s ease-in-out infinite' }}
                  aria-hidden="true"
                />
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500">{meta.hint}</p>
            </div>
          )}

          {/* ── Failed ──────────────────────────────────────────────────── */}
          {isFailed && (
            <p
              role="alert"
              className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-600 dark:bg-red-900/20 dark:text-red-400"
            >
              Generation failed. Please try submitting again.
            </p>
          )}

          {/* ── Result (expanded) ───────────────────────────────────────── */}
          {isCompleted && showResult && (
            <div className="space-y-3 pt-1">

              {/* Image comparison: Original → AI Generated */}
              {job.referenceImage && (
                <ImagePanel
                  src={job.referenceImage}
                  alt={`Original product image for ${job.productName}`}
                  label="Original Product Image"
                />
              )}

              {job.generatedImage ? (
                <ImagePanel
                  src={job.generatedImage}
                  alt={`AI generated image for ${job.productName}`}
                  label="AI Generated Image"
                />
              ) : (
                <div className="flex h-48 items-center justify-center rounded-lg border border-slate-200 bg-slate-100 text-sm text-slate-400 dark:border-slate-700 dark:bg-slate-800">
                  Image unavailable
                </div>
              )}

              {/* Collapsible Prompt Viewer */}
              {job.generatedPrompt && (
                <PromptViewer prompt={job.generatedPrompt} />
              )}
            </div>
          )}
        </CardContent>

        {/* ── Footer ────────────────────────────────────────────────────── */}
        {isCompleted && (
          <CardFooter className="flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowResult((s) => !s)}
              aria-expanded={showResult}
              aria-controls={`${cardId}-result`}
            >
              {showResult ? 'Hide Result' : 'View Result'}
            </Button>

            {job.generatedImage && (
              <>
                <a
                  href={job.generatedImage}
                  download={`${job.productName.replace(/\s+/g, '-').toLowerCase()}-ai.jpg`}
                  className={[
                    'inline-flex items-center justify-center gap-1.5 rounded-md border border-slate-300',
                    'bg-transparent px-3 py-1.5 text-xs font-medium text-slate-700',
                    'hover:bg-slate-50 transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
                    'dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800',
                  ].join(' ')}
                  aria-label={`Download AI generated image for ${job.productName}`}
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download
                </a>

                <a
                  href={job.generatedImage}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={[
                    'inline-flex items-center justify-center gap-1.5 rounded-md border border-slate-300',
                    'bg-transparent px-3 py-1.5 text-xs font-medium text-slate-700',
                    'hover:bg-slate-50 transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
                    'dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800',
                  ].join(' ')}
                  aria-label={`Open full size AI generated image for ${job.productName} in new tab`}
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Open Full
                </a>
              </>
            )}
          </CardFooter>
        )}
      </Card>
    </article>
  );
}
