'use client';

import type { JobCardData } from './JobCard';
import { cn } from '@/utils/cn';

type Props = {
  jobs: JobCardData[];
};

type StatCard = {
  label: string;
  count: number;
  colorClass: string;
  bgClass: string;
  icon: React.ReactNode;
};

function StatIcon({ path, className }: { path: string; className?: string }) {
  return (
    <svg
      className={cn('h-5 w-5', className)}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={path} />
    </svg>
  );
}

export function DashboardStats({ jobs }: Props) {
  const total      = jobs.length;
  const completed  = jobs.filter((j) => j.status === 'completed').length;
  const processing = jobs.filter((j) => j.status === 'pending' || j.status === 'processing').length;
  const failed     = jobs.filter((j) => j.status === 'failed').length;

  const stats: StatCard[] = [
    {
      label:      'Total Jobs',
      count:      total,
      colorClass: 'text-slate-700 dark:text-slate-200',
      bgClass:    'bg-slate-100 dark:bg-slate-800',
      icon: (
        <StatIcon
          className="text-slate-500 dark:text-slate-400"
          path="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z"
        />
      ),
    },
    {
      label:      'Completed',
      count:      completed,
      colorClass: 'text-emerald-700 dark:text-emerald-300',
      bgClass:    'bg-emerald-50 dark:bg-emerald-900/20',
      icon: (
        <StatIcon
          className="text-emerald-500 dark:text-emerald-400"
          path="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      ),
    },
    {
      label:      'Processing',
      count:      processing,
      colorClass: 'text-blue-700 dark:text-blue-300',
      bgClass:    'bg-blue-50 dark:bg-blue-900/20',
      icon: (
        <StatIcon
          className="text-blue-500 dark:text-blue-400 animate-spin"
          path="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
        />
      ),
    },
    {
      label:      'Failed',
      count:      failed,
      colorClass: 'text-red-700 dark:text-red-300',
      bgClass:    'bg-red-50 dark:bg-red-900/20',
      icon: (
        <StatIcon
          className="text-red-500 dark:text-red-400"
          path="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
        />
      ),
    },
  ];

  return (
    <div
      className="grid grid-cols-2 gap-3 sm:grid-cols-4"
      role="region"
      aria-label="Job statistics"
    >
      {stats.map(({ label, count, colorClass, bgClass, icon }) => (
        <div
          key={label}
          className={cn(
            'flex items-center gap-3 rounded-xl border border-slate-200 p-4',
            'dark:border-slate-700',
            bgClass,
          )}
        >
          <div className="shrink-0">{icon}</div>
          <div className="min-w-0">
            <p className={cn('text-2xl font-bold leading-none', colorClass)}>
              {count}
            </p>
            <p className="mt-0.5 text-xs font-medium text-slate-500 dark:text-slate-400 truncate">
              {label}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
