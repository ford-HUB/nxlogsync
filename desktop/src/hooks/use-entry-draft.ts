import { useState } from 'react'
import {
  DAILY_LIMIT_HOURS,
  DEFAULT_DRAFT_DURATION_MINUTES,
  DEFAULT_START_MINUTES,
  LAST_SELECTABLE_MINUTE,
  TIME_STEP_MINUTES,
} from '@/constants/daily-log'
import { findJob } from '@/constants/jobs'
import { formatClock, formatDuration } from '@/constants/time-format'
import { findWorkActivity } from '@/constants/work-activities'
import type { EntryDraft, Job, LogEntry, WorkActivity } from '@/types/daily-log'

function suggestRange(entries: LogEntry[], remainingMinutes: number) {
  const lastEnd = entries.reduce((max, e) => Math.max(max, e.endMinutes), 0)
  const duration = Math.min(DEFAULT_DRAFT_DURATION_MINUTES, remainingMinutes) || DEFAULT_DRAFT_DURATION_MINUTES
  const start = Math.min(lastEnd || DEFAULT_START_MINUTES, LAST_SELECTABLE_MINUTE - duration)
  return { startMinutes: start, endMinutes: start + duration }
}

function findIssue(
  startMinutes: number,
  endMinutes: number,
  entries: LogEntry[],
  remainingMinutes: number,
): string | null {
  if (remainingMinutes === 0) {
    return `The ${DAILY_LIMIT_HOURS}h daily limit is already reached.`
  }
  // Unreachable from the UI (the finish follows the start); kept as a guard.
  if (endMinutes <= startMinutes) return 'End time must be after the start time.'

  const clash = entries.find((e) => startMinutes < e.endMinutes && endMinutes > e.startMinutes)
  if (clash) {
    return `Overlaps ${formatClock(clash.startMinutes)} – ${formatClock(clash.endMinutes)} entry.`
  }
  if (endMinutes - startMinutes > remainingMinutes) {
    return `Only ${formatDuration(remainingMinutes)} left of the ${DAILY_LIMIT_HOURS}h daily limit.`
  }
  return null
}

/**
 * A start can't sit inside an entry (it may begin exactly when one ends), and needs
 * at least one step left in the day to finish.
 */
function isStartTaken(entries: LogEntry[], minutes: number) {
  if (minutes >= LAST_SELECTABLE_MINUTE) return true
  return entries.some((e) => minutes >= e.startMinutes && minutes < e.endMinutes)
}

/** A finish must come after the start and can't sit inside an entry (it may end as one begins). */
function isEndTaken(entries: LogEntry[], startMinutes: number, minutes: number) {
  if (minutes <= startMinutes) return true
  return entries.some((e) => minutes > e.startMinutes && minutes <= e.endMinutes)
}

/**
 * Moving the start onto or past the finish carries the finish along, keeping the
 * duration — but never past the next logged entry or the end of the day.
 */
function followStart(range: { startMinutes: number; endMinutes: number }, startMinutes: number, entries: LogEntry[]) {
  if (startMinutes < range.endMinutes) return { ...range, startMinutes }
  const duration = Math.max(TIME_STEP_MINUTES, range.endMinutes - range.startMinutes)
  const nextEntryStart = entries
    .map((e) => e.startMinutes)
    .filter((t) => t > startMinutes)
    .reduce((min, t) => Math.min(min, t), LAST_SELECTABLE_MINUTE)
  return { startMinutes, endMinutes: Math.min(startMinutes + duration, nextEntryStart) }
}

interface UseEntryDraftOptions {
  entries: LogEntry[]
  remainingMinutes: number
  /** When set, the draft edits this entry instead of creating a new one. */
  editingEntry: LogEntry | null
  onAdd: (draft: EntryDraft) => void
  onUpdate: (id: string, draft: EntryDraft) => void
}

export function useEntryDraft({ entries, remainingMinutes, editingEntry, onAdd, onUpdate }: UseEntryDraftOptions) {
  // While editing, the entry's own slot and hours are free to reuse.
  const otherEntries = editingEntry ? entries.filter((e) => e.id !== editingEntry.id) : entries
  const availableMinutes = editingEntry
    ? remainingMinutes + (editingEntry.endMinutes - editingEntry.startMinutes)
    : remainingMinutes

  const [range, setRange] = useState(() =>
    editingEntry
      ? { startMinutes: editingEntry.startMinutes, endMinutes: editingEntry.endMinutes }
      : suggestRange(entries, remainingMinutes),
  )
  const [description, setDescription] = useState(editingEntry?.description ?? '')
  const [job, setJob] = useState<Job | null>(() => findJob(editingEntry?.jobCode ?? null))
  const [workActivity, setWorkActivity] = useState<WorkActivity | null>(() =>
    findWorkActivity(editingEntry?.workActivityCode ?? null),
  )

  // Load the clicked entry (or go back to a fresh suggestion) when the target changes.
  // Updating state during render keeps the wheels animating instead of remounting them.
  const editingId = editingEntry?.id ?? null
  const [loadedId, setLoadedId] = useState(editingId)
  if (editingId !== loadedId) {
    setLoadedId(editingId)
    setRange(
      editingEntry
        ? { startMinutes: editingEntry.startMinutes, endMinutes: editingEntry.endMinutes }
        : suggestRange(entries, remainingMinutes),
    )
    setDescription(editingEntry?.description ?? '')
    // A fresh entry keeps the last job and activity; most tasks in a row share them.
    if (editingEntry) {
      setJob(findJob(editingEntry.jobCode))
      setWorkActivity(findWorkActivity(editingEntry.workActivityCode))
    }
  }

  const durationMinutes = Math.max(0, range.endMinutes - range.startMinutes)
  const issue = findIssue(range.startMinutes, range.endMinutes, otherEntries, availableMinutes)
  const isDirty =
    editingEntry === null ||
    range.startMinutes !== editingEntry.startMinutes ||
    range.endMinutes !== editingEntry.endMinutes ||
    description.trim() !== editingEntry.description ||
    (job?.code ?? null) !== editingEntry.jobCode ||
    (workActivity?.code ?? null) !== editingEntry.workActivityCode
  // The N-PAX upload needs both, so an entry can't be saved without them.
  const missing = !job ? 'a job' : !workActivity ? 'a work activity' : null
  const canSubmit = issue === null && missing === null && description.trim().length > 0 && isDirty

  const submit = () => {
    if (!canSubmit) return
    const draft: EntryDraft = {
      ...range,
      description: description.trim(),
      jobCode: job?.code ?? null,
      workActivityCode: workActivity?.code ?? null,
    }

    if (editingEntry) {
      // The parent clears editingEntry, which reloads a fresh suggestion above.
      onUpdate(editingEntry.id, draft)
      return
    }

    onAdd(draft)
    const nextRemaining = remainingMinutes - durationMinutes
    const nextDuration = Math.min(DEFAULT_DRAFT_DURATION_MINUTES, nextRemaining) || DEFAULT_DRAFT_DURATION_MINUTES
    const nextStart = Math.min(range.endMinutes, LAST_SELECTABLE_MINUTE - nextDuration)
    setRange({ startMinutes: nextStart, endMinutes: nextStart + nextDuration })
    setDescription('')
  }

  return {
    isEditing: editingEntry !== null,
    startMinutes: range.startMinutes,
    endMinutes: range.endMinutes,
    setStartMinutes: (startMinutes: number) => setRange((r) => followStart(r, startMinutes, otherEntries)),
    setEndMinutes: (endMinutes: number) => setRange((r) => ({ ...r, endMinutes })),
    /** Sets both times at once (e.g. from the task timer). */
    setTimes: (startMinutes: number, endMinutes: number) => setRange({ startMinutes, endMinutes }),
    isStartTaken: (minutes: number) => isStartTaken(otherEntries, minutes),
    isEndTaken: (minutes: number) => isEndTaken(otherEntries, range.startMinutes, minutes),
    description,
    setDescription,
    job,
    setJob,
    workActivity,
    setWorkActivity,
    /** What still has to be picked before saving, e.g. "a job"; null when both are set. */
    missing,
    durationMinutes,
    availableMinutes,
    issue,
    canSubmit,
    submit,
  }
}
