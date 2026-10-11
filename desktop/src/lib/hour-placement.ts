import {
  FEATURE_WORK_ACTIVITIES,
  FEM_FEATURE_SPLIT,
  FEP_DEVELOPMENT_WORK_ACTIVITIES,
  FEP_QA_WORK_ACTIVITIES,
  HOUR_SPLIT_STEP,
  INVESTIGATE_KEYWORDS,
  INVESTIGATE_WORK_ACTIVITIES,
  ISSUE_KEYWORDS,
  MEETING_KEYWORDS,
  MEETING_WORK_ACTIVITIES,
  QA_KEYWORDS,
} from '@/constants/excel-report'
import type { ActivityClass, HourBucket, ImportedRow, ReportKind, RequestHours } from '@/types/excel-report'

type Split = Record<HourBucket, number>

const only = (bucket: HourBucket, hours: number): Split => ({
  investigate: 0,
  development: 0,
  qa: 0,
  support: 0,
  [bucket]: hours,
})

const roundStep = (h: number) => Math.round(h / HOUR_SPLIT_STEP) * HOUR_SPLIT_STEP

/** Feature hours by FEM_FEATURE_SPLIT, in whole steps; development takes what rounding leaves. */
function featureSplit(hours: number): Split {
  const investigate = roundStep(hours * FEM_FEATURE_SPLIT.investigate)
  const qa = roundStep(hours * FEM_FEATURE_SPLIT.qa)
  return { investigate, development: hours - investigate - qa, qa, support: 0 }
}

interface Placement {
  split: Split
  rule: string
}

/**
 * FEM spreads feature work over three rows and puts everything else in one, decided in this order:
 * 1. a meeting (work activity or the word) → Support;
 * 2. "investigation" in the words, or DTADM work → Investigate only, even for feature work;
 * 3. feature work (DEV, DSG) → mostly Development, some Investigate and QA, no Support;
 * 4. QA / testing words → QA Checking;
 * 5. any other support → Investigate when the words say checking or a problem, else Support.
 */
function placeFem(description: string, workAccount: string, hours: number): Placement {
  if (MEETING_WORK_ACTIVITIES.has(workAccount) || MEETING_KEYWORDS.test(description))
    return { split: only('support', hours), rule: 'Meeting → Support' }
  if (/\bINVESTIGAT/.test(description))
    return { split: only('investigate', hours), rule: 'Investigation → Investigate only' }
  if (INVESTIGATE_WORK_ACTIVITIES.has(workAccount))
    return { split: only('investigate', hours), rule: `${workAccount} (data investigation) → Investigate` }
  if (FEATURE_WORK_ACTIVITIES.has(workAccount))
    return { split: featureSplit(hours), rule: 'Feature → mostly Development, some Investigate and QA' }
  if (QA_KEYWORDS.test(description)) return { split: only('qa', hours), rule: 'QA / testing words → QA Checking' }
  if (INVESTIGATE_KEYWORDS.test(description))
    return { split: only('investigate', hours), rule: 'Checking or a problem → Investigate' }
  return { split: only('support', hours), rule: 'Support' }
}

/**
 * FEP never splits a request and never uses Investigate: its workbook places each one by the Work
 * Activity it was logged under — DEV / DSG / DEPCOMP / DEPSITE → Development, QA → QA Checking, and
 * CRM, DTADM, DOCU, meetings and the rest → Support.
 */
function placeFep(workAccount: string, hours: number): Placement {
  if (FEP_DEVELOPMENT_WORK_ACTIVITIES.has(workAccount))
    return { split: only('development', hours), rule: `${workAccount} → Development` }
  if (FEP_QA_WORK_ACTIVITIES.has(workAccount)) return { split: only('qa', hours), rule: `${workAccount} → QA Checking` }
  return { split: only('support', hours), rule: `${workAccount || 'No code'} → Support` }
}

/** "LUXURY LANDY JOREN" → "LLJ" */
const initials = (name: string) =>
  name
    .replace(/[^A-Za-z\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase())
    .join('')

/** Page 3-Activity's Assigned To: each employee's initials once, in the order they first logged it. */
const assignedTo = (entries: ImportedRow[]) =>
  [...new Set(entries.map((r) => initials(r.employeeName || r.employeeId)).filter(Boolean))].join('/')

/**
 * Page 3-Activity's Classification, as the workbooks fill it: a numbered issue is an Issue; a
 * Feature is FEM work with Development hours, or FEP work in Development or QA Checking; the rest
 * is a Support.
 */
function classify(description: string, split: Split, kind: ReportKind): ActivityClass {
  if (ISSUE_KEYWORDS.test(description)) return 'issue'
  const feature = kind === 'FEP' ? split.development > 0 || split.qa > 0 : split.development > 0
  return feature ? 'feature' : 'support'
}

const remarkKey = (r: ImportedRow) => r.remarks.trim().replace(/\s+/g, ' ').toUpperCase()

/**
 * FEM lists a request once for the month; FEP lists each person's day of work on it, as logged
 * (one row per date, employee, Work Activity and remark).
 */
const groupKey = (r: ImportedRow, kind: ReportKind) =>
  kind === 'FEP'
    ? [r.date, r.employeeId || r.employeeName, r.workAccount.trim().toUpperCase(), remarkKey(r)].join('|')
    : `${r.jobCode}|${remarkKey(r)}`

/**
 * Page 4-Request: entries in the same group (see groupKey) are one request; its hours are summed
 * and placed by the report's rules. Rows with no hours are left out. Ordered by first date.
 */
export function buildRequestHours(rows: ImportedRow[], kind: ReportKind): RequestHours[] {
  const groups = new Map<string, ImportedRow[]>()
  for (const r of rows) {
    if (r.hours === null) continue
    const key = groupKey(r, kind)
    groups.set(key, [...(groups.get(key) ?? []), r])
  }

  return [...groups.values()]
    .map((entries) => {
      const first = entries.reduce((a, b) => (b.date < a.date ? b : a))
      const total = entries.reduce((sum, r) => sum + (r.hours ?? 0), 0)
      const description = first.remarks.trim().replace(/\s+/g, ' ').toUpperCase()
      const workAccount = first.workAccount.trim().toUpperCase()
      const { split, rule } =
        kind === 'FEM' ? placeFem(description, workAccount, total) : placeFep(workAccount, total)
      return {
        description: first.remarks,
        date: first.date,
        entries: entries.length,
        total,
        split,
        rule,
        assignedTo: assignedTo(entries),
        classification: classify(description, split, kind),
      }
    })
    .sort((a, b) => a.date.localeCompare(b.date))
}
