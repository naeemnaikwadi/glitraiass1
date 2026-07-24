'use client';

import { useState } from 'react';
import { GenerateForm } from './GenerateForm';
import { JobList } from '@/components/jobs/JobList';
import { DashboardStats } from '@/components/jobs/DashboardStats';
import type { JobCardData } from '@/components/jobs/JobCard';

export function GeneratePageClient() {
  const [latestJobId, setLatestJobId] = useState<string | null>(null);
  const [jobs, setJobs] = useState<JobCardData[]>([]);

  return (
    <div className="space-y-8">
      {/* Dashboard Stats */}
      <DashboardStats jobs={jobs} />

      {/* Generate Form */}
      <GenerateForm onJobCreated={setLatestJobId} />

      {/* Jobs section */}
      <section aria-labelledby="jobs-heading">
        <h2
          id="jobs-heading"
          className="mb-5 text-xl font-semibold text-slate-900 dark:text-slate-100"
        >
          Generation Jobs
        </h2>
        <JobList latestJobId={latestJobId} onJobsChange={setJobs} />
      </section>
    </div>
  );
}
