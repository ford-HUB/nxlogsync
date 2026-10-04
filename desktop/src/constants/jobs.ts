import type { Job } from '@/types/daily-log'

/** Jobs copied from the N-PAX Job Lookup; "ALL" jobs show under every cost center. */
export const COST_CENTERS = ['NXPERT / ERP CRM', 'NXPERT / ERP WEB'] as const

/** Cost center the job lookup opens on. */
export const DEFAULT_COST_CENTER: string = 'NXPERT / ERP CRM'

export const JOBS: Job[] = [
  { code: 'CL00-00003-001', clientJobNo: '', clientJobName: 'FUJI ELECTRIC SEMICONDUCTOR (MALAYSIA) SDN., BHD. - ERP MAINTENANCE', costCenter: 'ALL', category: 'B', external: false },
  { code: 'CL00-00007-001', clientJobNo: '', clientJobName: 'FUJI ELECTRIC PHILS., INC. - ERP MAINTENANCE', costCenter: 'ALL', category: 'B', external: false },
  { code: 'CL00-00036-001', clientJobNo: '', clientJobName: 'N-PAX CEBU CORPORATION', costCenter: 'ALL', category: '', external: false },
]

/** The job for a saved code; one missing from the list still shows by its code. */
export function findJob(code: string | null): Job | null {
  if (!code) return null
  return JOBS.find((j) => j.code === code) ?? { code, clientJobNo: '', clientJobName: '', costCenter: '', category: '', external: false }
}

/** Rows per page in the job lookup table. */
export const JOB_LOOKUP_PAGE_SIZE = 10
