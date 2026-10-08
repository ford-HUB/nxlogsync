import { useEffect, useMemo, useState } from 'react'
import { MAX_REPORT_MONTHS, REPORT_COPIED_MS, REPORT_MONTHS_BACK, formatReportText, monthSpan, shiftMonthKey, toMonthKey } from '@/constants/reports'
import { useNow } from '@/hooks/use-now'
import { toDateKey } from '@/constants/time-format'
import { useReportsStore } from '@/store/reports-store'
import type { ReportFileFormat } from '@/types/reports'

/**
 * The entries report for a month range. `initialMonth` ("YYYY-MM") opens it on
 * that month; null means the dialog is closed, which drops the loaded report.
 */
export function useEntriesReport(initialMonth: string | null) {
  const currentMonth = toMonthKey(toDateKey(useNow()))
  const [range, setRange] = useState({ from: initialMonth ?? currentMonth, to: initialMonth ?? currentMonth })
  const [copied, setCopied] = useState(false)
  const report = useReportsStore((s) => s.report)
  const loading = useReportsStore((s) => s.loading)
  const busy = useReportsStore((s) => s.busy)
  const error = useReportsStore((s) => s.error)
  const fetchReport = useReportsStore((s) => s.fetchReport)
  const exportReport = useReportsStore((s) => s.exportReport)
  const dismissError = useReportsStore((s) => s.dismissError)
  const reset = useReportsStore((s) => s.reset)
  const open = initialMonth !== null

  // Each open starts on the month it was opened for.
  const [openedFor, setOpenedFor] = useState(initialMonth)
  if (initialMonth !== openedFor) {
    setOpenedFor(initialMonth)
    if (initialMonth) setRange({ from: initialMonth, to: initialMonth })
  }

  useEffect(() => {
    if (open) void fetchReport(range.from, range.to)
    else reset()
  }, [open, range.from, range.to, fetchReport, reset])

  useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(false), REPORT_COPIED_MS)
    return () => clearTimeout(timer)
  }, [copied])

  /** Newest first, current month down to REPORT_MONTHS_BACK months ago. */
  const monthOptions = useMemo(
    () => Array.from({ length: REPORT_MONTHS_BACK }, (_, i) => shiftMonthKey(currentMonth, -i)),
    [currentMonth],
  )

  // Moving one end past the other, or beyond the longest span, drags the other end along.
  const setFrom = (from: string) =>
    setRange(({ to }) => {
      if (to < from) return { from, to: from }
      if (monthSpan(from, to) > MAX_REPORT_MONTHS) return { from, to: shiftMonthKey(from, MAX_REPORT_MONTHS - 1) }
      return { from, to }
    })
  const setTo = (to: string) =>
    setRange(({ from }) => {
      if (from > to) return { from: to, to }
      if (monthSpan(from, to) > MAX_REPORT_MONTHS) return { from: shiftMonthKey(to, -(MAX_REPORT_MONTHS - 1)), to }
      return { from, to }
    })

  const span = monthSpan(range.from, range.to)
  const earliestMonth = monthOptions[monthOptions.length - 1]
  const canShiftBack = shiftMonthKey(range.from, -span) >= earliestMonth
  const canShiftForward = shiftMonthKey(range.to, span) <= currentMonth

  /** Steps the whole range back or forward by its own length, within the months the pickers list. */
  const shift = (direction: -1 | 1) => {
    if (direction === -1 ? !canShiftBack : !canShiftForward) return
    setRange({ from: shiftMonthKey(range.from, direction * span), to: shiftMonthKey(range.to, direction * span) })
  }

  const copyText = async () => {
    if (!report) return
    try {
      await navigator.clipboard.writeText(formatReportText(report))
      setCopied(true)
    } catch {
      // Clipboard blocked: nothing to undo; the button just doesn't confirm.
    }
  }

  const hasEntries = (report?.entryCount ?? 0) > 0

  return {
    from: range.from,
    to: range.to,
    monthOptions,
    canShiftBack,
    canShiftForward,
    report,
    loading,
    busy,
    error,
    copied,
    hasEntries,
    setFrom,
    setTo,
    shift,
    copyText,
    exportAs: (format: ReportFileFormat) => exportReport(format, range.from, range.to),
    dismissError,
  }
}
