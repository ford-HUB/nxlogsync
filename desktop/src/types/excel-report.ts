/** Which monthly maintenance report is generated; both share one fixed workbook layout. */
export type ReportKind = 'FEP' | 'FEM'

export type ImportRowStatus = 'ok' | 'warning' | 'error'

/** The manhour export's sheet a row came from: Approved is the base, On Route only fills gaps. */
export type ManhourApproval = 'approved' | 'on-route'

/**
 * One manhour entry extracted for a report, in the monthly manhour export's columns: Date, Job
 * Code, Job Name, Employee ID, Employee Name, Work Account Code, Plan Hours, Remarks.
 */
export interface ImportedRow {
  id: string
  /** "2026-09-01" */
  date: string
  jobCode: string
  jobName: string
  employeeId: string
  employeeName: string
  /** The Work Activity code, as our system defines it (constants/work-activities.ts): "DEV", "CRM", … */
  workAccount: string
  /** Its Work Activity name, or null when the code is not one of ours. */
  workActivityName: string | null
  /** The export's PLAN HOURS column: the hours this entry logged. */
  hours: number | null
  remarks: string
  approval: ManhourApproval
  status: ImportRowStatus
  /** Why a row is flagged; empty when status is 'ok'. */
  issue?: string
}

/** One manhour export row as read, before it is checked. */
export interface ManhourEntry {
  date: string
  jobCode: string
  jobName: string
  employeeId: string
  employeeName: string
  workAccount: string
  hours: number | null
  remarks: string
}

/** A monthly manhour export as read: every job's entries, per sheet. */
export interface ManhourFile {
  fileName: string
  /** "September 2026": the month most entries fall in. */
  month: string
  approved: ManhourEntry[]
  onRoute: ManhourEntry[]
}

/** What the pre-template pulled out of one monthly manhour file. */
export interface ImportedSheet {
  fileName: string
  /** "September 2026" */
  month: string
  /** Every entry in the file, all jobs. */
  totalRows: number
  /** This report's entries: every Approved one, plus On Route ones Approved doesn't have. */
  rows: ImportedRow[]
  /** On Route entries skipped because Approved already has them. */
  onRouteDuplicates: number
}

/** Page 4-Request's four hour rows under every request. */
export type HourBucket = 'investigate' | 'development' | 'qa' | 'support'

/** Page 3-Activity's Classification columns. */
export type ActivityClass = 'issue' | 'feature' | 'support'

/** One Page 4-Request block: a request's hours, estimated into the four rows. */
export interface RequestHours {
  description: string
  /** The first day it was logged. */
  date: string
  entries: number
  total: number
  split: Record<HourBucket, number>
  /** Which placement rule decided the split, in words. */
  rule: string
  /** Page 3-Activity's Assigned To: the employees' initials, "LJT/CDB". */
  assignedTo: string
  classification: ActivityClass
}

/** A built-in pre-template: which jobs feed the report and the budget it is measured against. */
export interface ReportTemplate {
  kind: ReportKind
  client: string
  jobs: { code: string; name: string }[]
  /** Support hours → Plan, per month. */
  planHours: number
  /** The workbook's visible pages, in order. */
  pages: string[]
  /** Page 4-Request's Req Person on every request, when the report fills it. */
  reqPerson?: string
}

/** One Monthly Overview line: what is printed, and the remark it came from. */
export interface OverviewItem {
  text: string
  original: string
  /** True when the printed text differs from the remark (rephrased, trimmed or cut). */
  shortened: boolean
}

export interface GeneratedReport {
  kind: ReportKind
  /** "SEPTEMBER FEP MONTHLY MAINTENANCE REPORT" */
  title: string
  /** Monthly Overview: the sent and for-deployment updates. */
  overview: OverviewItem[]
  planHours: number
  actualHours: number
  workingDays: number
  /** Hours per Work Activity, largest first. */
  byWorkActivity: { code: string; name: string; hours: number }[]
  byJob: { code: string; name: string; hours: number }[]
  /** Page 4-Request: hours per request, placed into Investigate / Development / QA / Support. */
  requests: RequestHours[]
}

/** One Page 3-Activity row of the yearly workbook. */
export interface WorkbookActivity {
  /** "2026-08": the month group it is listed under. */
  month: string
  description: string
  /** "2026-08-04" (Date Reported / Started), or '' when blank. */
  date: string
  assignedTo: string
  classification: ActivityClass | null
  /** Whether Page 2-Graph's chart has a band for it (Excel charts cap at 255 series). */
  inGraph: boolean
}

/** One Page 4-Request block of the yearly workbook, with its hours per fiscal month. */
export interface WorkbookRequest {
  date: string
  description: string
  reqPerson: string
  status: string
  /** Hours per bucket row, one number per fiscal month (MaintenanceWorkbook.months). */
  hours: Record<HourBucket, number[]>
}

/**
 * The yearly maintenance workbook (e.g. "FEM Monthly Maintenance Report 2026 - 2027.xlsm") as read,
 * or as it is after a month was added: what the PDF prints, page by page.
 */
export interface MaintenanceWorkbook {
  fileName: string
  /** The fiscal year's 12 months, "2026-07" … "2027-06" (Support hours row 29). */
  months: string[]
  /** Support hours A1: "2026-2027 MAINTENANCE HOURS". */
  hoursTitle: string
  /** Support hours → Plan per month. */
  plan: number[]
  /** Monthly Maintenance Report page. */
  title: string
  overview: string[]
  workingDays: number | null
  /** Page 2-Graph's title: "ACTIVITY SUMMARY" for the year, or "JULY 2026 ACTIVITY SUMMARY" for a month. */
  graphTitle: string
  /** The red N-PAX sign-off stamps under NO OF DAYS, left to right. */
  stamps: SignOffStamp[]
  activities: WorkbookActivity[]
  requests: WorkbookRequest[]
}

/** One red sign-off stamp: "N-PAX", the date ("10.11.26") and the initials ("CDB"). */
export interface SignOffStamp {
  label: string
  date: string
  initials: string
}

/**
 * What the page asks for the stamps: the date created, the supervisor (first stamp) and who prepared
 * the report (second stamp). The third stamp keeps its initials and only gets the date.
 */
export interface SignOff {
  /** "10.11.26" */
  date: string
  supervisor: string
  preparedBy: string
}

/** The yearly workbook with the report's month written into it. */
export interface FilledWorkbook {
  /** The updated .xlsm/.xlsx, macros and charts kept. */
  bytes: Uint8Array
  workbook: MaintenanceWorkbook
}
