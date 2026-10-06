import { get, type ApiResult } from './api-client'

/** "Time In 1" from N-PAX for a day ("HH:mm"), or null while it's blank. Read from the site, so it can take a few seconds. */
export function getTimeIn(date: string): Promise<ApiResult<{ date: string; timeIn: string | null }>> {
  return get('/v1/attendance/time-in', { date })
}
