import { get, type ApiResult } from './api-client'
import type { JobLookup } from '@/types/daily-log'

/**
 * The signed-in user's Job lookup from N-PAX. The server keeps a copy for an hour;
 * `refresh` reads the site again, which can take a while.
 */
export function getJobs(refresh = false): Promise<ApiResult<JobLookup>> {
  return get('/v1/jobs', refresh ? { refresh: 'true' } : undefined)
}
