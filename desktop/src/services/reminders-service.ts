import { REMINDER_EMAIL_TIMEOUT_MS } from '@/constants/reminders'
import { get, post, put, type ApiResult } from './api-client'
import type { ReminderSchedule, ReminderSettings } from '@/types/reminders'

export function getReminder(): Promise<ApiResult<ReminderSettings>> {
  return get('/v1/reminders')
}

export function saveReminder(schedule: ReminderSchedule): Promise<ApiResult<ReminderSettings>> {
  return put('/v1/reminders', schedule)
}

/** Has the server read the email from N-PAX again; can take a while. */
export function refreshReminderEmail(): Promise<ApiResult<ReminderSettings>> {
  return post('/v1/reminders/email', {}, { timeoutMs: REMINDER_EMAIL_TIMEOUT_MS })
}

/** Sends a reminder now; reads the email from N-PAX first if none is stored yet. */
export function sendTestReminder(): Promise<ApiResult<{ email: string }>> {
  return post('/v1/reminders/test', {}, { timeoutMs: REMINDER_EMAIL_TIMEOUT_MS })
}
