import type { HourBucket, ImportRowStatus, ReportKind, ReportTemplate } from '@/types/excel-report'

/** File extensions the import accepts; .xlsm is the macro-enabled workbook (Excel.SheetMacroEnabled). */
export const EXCEL_EXTENSIONS = ['.xlsx', '.xlsm', '.xls', '.csv']

/** The file picker's accept attribute. */
export const EXCEL_ACCEPT = EXCEL_EXTENSIONS.join(',')

/** "Report.XLSM" → true */
export const isExcelFile = (name: string) => EXCEL_EXTENSIONS.some((ext) => name.toLowerCase().endsWith(ext))

export const REPORT_KINDS: ReportKind[] = ['FEP', 'FEM']

/** The pages both maintenance workbooks share; the layout is fixed, so the templates are built in. */
const TEMPLATE_PAGES = [
  'Monthly Maintenance Report',
  'Support hours',
  'Page 2 · Graph',
  'Page 3 · Activity',
  'Page 4 · Request',
  'Page 5 · Data',
]

/** Support hours → Plan: the hours budgeted per month (the export's MAINTENANCE HOURS). */
export const MONTHLY_PLAN_HOURS = 180

/**
 * The pre-templates: each report keeps only the manhour entries on its client's job codes, so the
 * whole monthly export can be imported as-is.
 */
export const REPORT_TEMPLATES: Record<ReportKind, ReportTemplate> = {
  FEP: {
    kind: 'FEP',
    client: 'Fuji Electric Phils., Inc.',
    jobs: [{ code: 'CL00-00007-001', name: 'ERP Maintenance' }],
    planHours: MONTHLY_PLAN_HOURS,
    pages: TEMPLATE_PAGES,
    reqPerson: 'Quality Management Section',
  },
  FEM: {
    kind: 'FEM',
    client: 'Fuji Electric Semiconductor (Malaysia) Sdn. Bhd.',
    jobs: [{ code: 'CL00-00003-001', name: 'ERP Maintenance' }],
    planHours: MONTHLY_PLAN_HOURS,
    pages: TEMPLATE_PAGES,
  },
}

/** The monthly manhour export's sheets the import reads. */
export const MANHOUR_SHEET_NAMES = { approved: 'Approved', onRoute: 'On Route' }
export const MANHOUR_SHEETS = Object.values(MANHOUR_SHEET_NAMES)

/** Header text (case and spacing aside) of each column the import reads; the header row is found by these. */
export const MANHOUR_HEADERS = {
  date: 'DATE',
  jobCode: 'JOB CODE',
  jobName: 'JOB NAME',
  employeeId: 'EMPLOYEE ID',
  employeeName: 'EMPLOYEE NAME',
  workAccount: 'WORK ACCOUNT CODE',
  hours: 'PLAN HOURS',
  remarks: 'REMARKS',
} as const

/** Columns that must be present; the rest are read when there. */
export const MANHOUR_REQUIRED: (keyof typeof MANHOUR_HEADERS)[] = ['date', 'jobCode', 'workAccount', 'hours', 'remarks']

export const MANHOUR_COLUMNS = MANHOUR_REQUIRED.map((k) => MANHOUR_HEADERS[k])

/** How many rows from the top of a sheet to search for the header row. */
export const MANHOUR_HEADER_SEARCH_ROWS = 15

/** Legend and filter order for row statuses. */
export const IMPORT_STATUS_ORDER: ImportRowStatus[] = ['ok', 'warning', 'error']

export const IMPORT_STATUS_LABEL: Record<ImportRowStatus, string> = {
  ok: 'Ready',
  warning: 'Check',
  error: 'Invalid',
}

/** Bar segment and legend dot colour per status. */
export const IMPORT_STATUS_DOT: Record<ImportRowStatus, string> = {
  ok: 'bg-emerald-500',
  warning: 'bg-amber-500',
  error: 'bg-red-500',
}

export const IMPORT_STATUS_BADGE: Record<ImportRowStatus, string> = {
  ok: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  warning: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
  error: 'bg-red-500/10 text-red-700 dark:text-red-400',
}

/** A Monthly Overview item longer than this many words gets shortened, so each fits one printed line. */
export const OVERVIEW_WORD_LIMIT = 12

/**
 * Two overview items whose words overlap at least this much (shared ÷ all distinct words) are the
 * same update, listed once. High on purpose: "CHECKING ON ISSUE X" and "DEVELOPMENT ON ISSUE X"
 * stay separate lines.
 */
export const OVERVIEW_SAME_ITEM_OVERLAP = 0.85

/** Wordy openings and their short form, applied in order to the uppercased text. */
export const OVERVIEW_PHRASES: [RegExp, string][] = [
  [/\bINVESTIGATION OF\b/g, 'INVESTIGATE'],
  [/\bINVESTIGATION\b/g, 'INVESTIGATE'],
  [/\bCHECKING (ON|OF)\b/g, 'CHECK'],
  [/\bDEVELOPMENT (ON|OF)\b/g, 'DEVELOP'],
  [/\bDEVELOPED NEW\b/g, 'NEW'],
  [/\bIMPLEMENTATION REQUEST\b/g, 'IMPLEMENT'],
  [/\bWITHOUT\b/g, 'W/O'],
  [/\bWITH\b/g, 'W/'],
  [/\bAND\b/g, '&'],
]

/** Words dropped only when an item is still over the limit after rephrasing. */
export const OVERVIEW_FILLER_WORDS = new Set(['THE', 'A', 'AN', 'OF', 'FOR', 'ON', 'TO', 'IN'])

/** Page 4-Request's hour rows, in the workbook's order and wording. */
export const HOUR_BUCKET_ORDER: HourBucket[] = ['investigate', 'development', 'qa', 'support']

export const HOUR_BUCKET_LABEL: Record<HourBucket, string> = {
  investigate: 'Investigate',
  development: 'Development/Form Revision',
  qa: 'QA Checking',
  support: 'Support',
}

/** Work Activities (constants/work-activities.ts) that count as feature work. */
export const FEATURE_WORK_ACTIVITIES = new Set(['DEV', 'DSG'])

/** Work Activities that are meetings. */
export const MEETING_WORK_ACTIVITIES = new Set(['MTGCOMP', 'MTGCLNT'])

/** Work Activities that are investigation by definition ("Backdoor, Data Investigation"). */
export const INVESTIGATE_WORK_ACTIVITIES = new Set(['DTADM'])

/**
 * FEM feature work: mostly development, a bit of investigation and QA, no support. From the FEM
 * workbook's feature requests (27% / 53% / 20%), leaning further into development.
 */
export const FEM_FEATURE_SPLIT: Record<HourBucket, number> = {
  investigate: 0.2,
  development: 0.6,
  qa: 0.2,
  support: 0,
}

/** Split hours are rounded to this step (h); development takes the remainder. */
export const HOUR_SPLIT_STEP = 0.5

/** FEP places a request by its Work Activity alone: these go to Development, QA to QA Checking, the rest to Support. */
export const FEP_DEVELOPMENT_WORK_ACTIVITIES = new Set(['DEV', 'DSG', 'DEPCOMP', 'DEPSITE'])
export const FEP_QA_WORK_ACTIVITIES = new Set(['QA'])

/** Description keywords, matched on whole words of the uppercased text. */
export const MEETING_KEYWORDS = /\bMEETING\b|\bMTG\b/
export const INVESTIGATE_KEYWORDS = /\bINVESTIGAT\w*|\bCHECK(ING)?\b|\bISSUE\b|\bERROR\b|\bBUG\b|\bMISSING\b|\bNOT RUNNING\b/
/** A numbered issue ("ISSUE #6201 DEFECT CODE SAVING ERROR") is classified as an Issue. */
export const ISSUE_KEYWORDS = /\bISSUE\s*#\s*\d/
export const QA_KEYWORDS = /\bQA\b|\bTEST(ING)?\b|\bUAT\b/

/** The yearly maintenance workbook the month is written into; FEP and FEM share this layout. */
export const WORKBOOK_SHEETS = {
  front: 'Monthly Maintenance Report',
  hours: 'Support hours',
  graph: 'Page 2-Graph',
  activity: 'Page 3-Activity',
  request: 'Page 4-Request',
  data: 'Page 5- Data',
} as const

/** Fixed cells and rows of the workbook's pages (1-based rows, as Excel shows them). */
export const WORKBOOK_LAYOUT = {
  /** Monthly Maintenance Report: the title, and the first Monthly Overview row (No. in C, text in D:W). */
  frontTitle: 'B3',
  overviewFirstRow: 11,
  /** Support hours: month headers, Plan, Actual and Variance rows in D:O, the year's total in C. */
  hoursMonthRow: 29,
  hoursPlanRow: 30,
  hoursActualRow: 31,
  hoursVarianceRow: 32,
  /** Page 3-Activity: the first activity row. */
  activityFirstRow: 7,
  /** Page 4-Request: month headers, the Total row, and each block's 6 rows (header, 4 hour rows, gap). */
  requestMonthRow: 3,
  requestTotalRow: 4,
  requestFirstRow: 6,
  requestBlockRows: 6,
  /** A printed Page 4-Request page holds 8 blocks. */
  requestRowsPerPage: 48,
  /** Page 5- Data: the first month row (12 rows, one per fiscal month). */
  dataFirstRow: 8,
} as const

/** The Status every Page 4-Request row is given. */
export const REQUEST_STATUS = 'Finished'

/** Page 4-Request's hour row labels, with the workbook's indent. */
export const REQUEST_BUCKET_LABEL: Record<HourBucket, string> = {
  investigate: '   Investigate',
  development: '   Development/Form Revision',
  qa: '   QA Checking',
  support: '   Support',
}
