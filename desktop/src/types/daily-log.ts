/** Times are minutes since local midnight (0–1439). */
export interface LogEntry {
  id: string
  startMinutes: number
  endMinutes: number
  description: string
  /** N-PAX Job code; null on entries logged before jobs were picked. */
  jobCode: string | null
  /** N-PAX Work Activity code; null on entries logged before activities were picked. */
  workActivityCode: string | null
}

export interface EntryDraft {
  startMinutes: number
  endMinutes: number
  description: string
  jobCode: string | null
  workActivityCode: string | null
}

export type DayStatus = 'empty' | 'in-progress' | 'near-limit' | 'full' | 'over-limit'

export interface WheelOption {
  value: number
  label: string
}

/** Heatmap intensity for one day's logged hours, relative to the daily limit. */
export type ActivityLevel = 'none' | 'low' | 'medium' | 'high' | 'full' | 'over'

/** A chargeable job from the site's Job Lookup. */
export interface Job {
  code: string
  clientJobNo: string
  clientJobName: string
  costCenter: string
  /** "B" = billable; empty for non-billable jobs (as the lookup shows it). */
  category: string
  /** External (EXT) job, hidden unless the lookup's EXT filter is on. */
  external: boolean
}

/** A work activity from the site's Work Activity lookup. */
export interface WorkActivity {
  code: string
  category: string
  name: string
  /** Typical tasks under this activity; empty when the site shows "_". */
  details: string
  /** FBS code as the site lists it (some carry a `|$|` suffix); empty when missing. */
  fbsCode: string
}
