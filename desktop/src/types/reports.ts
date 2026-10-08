/** One logged entry as a report lists it. */
export interface ReportEntry {
  id: string
  /** "YYYY-MM-DD" */
  date: string
  startMinutes: number
  endMinutes: number
  jobCode: string | null
  /** The job's client name from the user's lookup; the code when it isn't listed there. */
  jobName: string
  workActivityCode: string | null
  description: string
  /** Work minutes, lunch break left out. */
  minutes: number
}

export interface ReportMonth {
  /** "YYYY-MM" */
  month: string
  /** "October 2026" */
  label: string
  totalMinutes: number
  entries: ReportEntry[]
}

/** The signed-in user's entries from one month to another, grouped by month. */
export interface EntriesReport {
  employee: string
  /** "YYYY-MM" */
  from: string
  /** "YYYY-MM" */
  to: string
  generatedAt: string
  totalMinutes: number
  entryCount: number
  dayCount: number
  /** Every month in the range, oldest first, including months without entries. */
  months: ReportMonth[]
}

export type ReportFileFormat = 'pdf' | 'xlsx'
