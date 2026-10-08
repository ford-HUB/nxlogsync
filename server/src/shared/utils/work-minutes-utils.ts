/** The shift's unpaid break, which N-PAX leaves out of Work Hours (12:00–13:00). */
export const BREAK_START_MINUTES = 12 * 60;
export const BREAK_END_MINUTES = 13 * 60;

/**
 * Minutes that count toward the day, as N-PAX counts them: the span less any
 * part of the break it covers — 10:45–15:55 is 4h 10m, not 5h 10m. Matches the
 * desktop's `workMinutes`.
 */
export function workMinutes(startMinutes: number, endMinutes: number): number {
  const onBreak = Math.max(
    0,
    Math.min(endMinutes, BREAK_END_MINUTES) -
      Math.max(startMinutes, BREAK_START_MINUTES),
  );
  return Math.max(0, endMinutes - startMinutes - onBreak);
}

/** 60 → "1 hour", 90 → "1.5 hours", 20 → "0.33 hours" */
export function formatHours(minutes: number): string {
  const hours = Math.round((minutes / 60) * 100) / 100;
  return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
}
