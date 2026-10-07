import type { Job } from '@/types/daily-log'

/** The job for a saved code; one missing from the user's lookup still shows by its code. */
export function findJob(jobs: Job[], code: string | null): Job | null {
  if (!code) return null
  return jobs.find((j) => j.code === code) ?? { code, clientJobNo: '', clientJobName: '', costCenter: '', category: '' }
}

/** Rows per page in the job lookup table. */
export const JOB_LOOKUP_PAGE_SIZE = 10

/** Placeholder rows shown while the lookup is read from N-PAX. */
export const JOB_LOOKUP_SKELETON_ROWS = 3
