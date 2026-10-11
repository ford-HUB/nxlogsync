import { findWorkActivity } from '@/constants/work-activities'
import type { ImportedRow, ManhourApproval, ManhourEntry } from '@/types/excel-report'

/** Two rows are the same entry when everything an employee logged matches; casing and spacing aside. */
function entryKey(e: ManhourEntry): string {
  const text = (v: string) => v.trim().replace(/\s+/g, ' ').toUpperCase()
  return [e.date, text(e.jobCode), text(e.employeeId), text(e.workAccount), e.hours ?? '', text(e.remarks)].join('|')
}

function toRow(e: ManhourEntry, approval: ManhourApproval, id: string): ImportedRow {
  const activity = findWorkActivity(e.workAccount.trim().toUpperCase())
  const issue =
    e.hours === null
      ? 'Plan Hours is empty'
      : !activity
        ? `${e.workAccount || 'Empty code'} is not one of our Work Activities`
        : undefined
  return {
    id,
    ...e,
    workActivityName: activity?.name ?? null,
    approval,
    status: e.hours === null ? 'error' : activity ? 'ok' : 'warning',
    issue,
  }
}

/**
 * Approved is the base. An On Route entry is added only when Approved has no matching entry
 * (see entryKey); the matches are counted, not added twice. Rows come back sorted by date.
 */
export function mergeManhourSheets(
  approved: ManhourEntry[],
  onRoute: ManhourEntry[],
): { rows: ImportedRow[]; onRouteDuplicates: number } {
  const known = new Set(approved.map(entryKey))
  const added = onRoute.filter((e) => !known.has(entryKey(e)))
  const rows = [
    ...approved.map((e, i) => toRow(e, 'approved', `a${i}`)),
    ...added.map((e, i) => toRow(e, 'on-route', `o${i}`)),
  ].sort((a, b) => a.date.localeCompare(b.date))
  return { rows, onRouteDuplicates: onRoute.length - added.length }
}
