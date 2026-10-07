import { useState } from 'react'
import {
  DAILY_LIMIT_HOURS,
  DEFAULT_DRAFT_DURATION_MINUTES,
  DEFAULT_START_MINUTES,
  LAST_SELECTABLE_MINUTE,
  finishForWork,
  TIME_STEP_MINUTES,
  workMinutes,
} from '@/constants/daily-log'
import { findJob } from '@/constants/jobs'
import { useJobsStore } from '@/store/jobs-store'
import { formatClock, formatDuration } from '@/constants/time-format'
import { findWorkActivity } from '@/constants/work-activities'
import type { EntryDraft, Job, LogEntry, WorkActivity } from '@/types/daily-log'

const DESCRIPTION_KEY_PREFIX = 'nxlogsync.entry-draft.description.'

/** The unsaved new-entry description for a day, so changing day doesn't erase it. */
function readCachedDescription(dateKey: string): string {
  try {
    return localStorage.getItem(DESCRIPTION_KEY_PREFIX + dateKey) ?? ''
  } catch {
    return ''
  }
}

function writeCachedDescription(dateKey: string, value: string) {
  try {
    if (value.trim()) localStorage.setItem(DESCRIPTION_KEY_PREFIX + dateKey, value)
    else localStorage.removeItem(DESCRIPTION_KEY_PREFIX + dateKey)
  } catch {
    // Storage blocked: the draft still lives until the day changes.
  }
}

/**
 * The first task of a day starts at the shift start (from the N-PAX time in)
 * when N-PAX has one, else the default start; later tasks follow the last entry.
 */
function suggestRange(entries: LogEntry[], remainingMinutes: number, timeInMinutes: number | null) {
  const lastEnd = entries.reduce((max, e) => Math.max(max, e.endMinutes), 0)
  const duration = Math.min(DEFAULT_DRAFT_DURATION_MINUTES, remainingMinutes) || DEFAULT_DRAFT_DURATION_MINUTES
  const firstStart =
    timeInMinutes === null ? DEFAULT_START_MINUTES : Math.ceil(timeInMinutes / TIME_STEP_MINUTES) * TIME_STEP_MINUTES
  const start = Math.min(lastEnd || firstStart, LAST_SELECTABLE_MINUTE - duration)
  return { startMinutes: start, endMinutes: start + duration }
}

function findIssue(
  startMinutes: number,
  endMinutes: number,
  entries: LogEntry[],
  remainingMinutes: number,
  overtimeMinutes: number,
): string | null {
  if (remainingMinutes === 0) {
    return overtimeMinutes > 0
      ? `${formatDuration(overtimeMinutes)} over the ${DAILY_LIMIT_HOURS}h daily limit.`
      : `The ${DAILY_LIMIT_HOURS}h daily limit is reached.`
  }
  // Unreachable from the UI (the finish follows the start); kept as a guard.
  if (endMinutes <= startMinutes) return 'End time must be after the start time.'

  const clash = entries.find((e) => startMinutes < e.endMinutes && endMinutes > e.startMinutes)
  if (clash) {
    return `Overlaps ${formatClock(clash.startMinutes)} – ${formatClock(clash.endMinutes)} entry.`
  }
  if (workMinutes(startMinutes, endMinutes) > remainingMinutes) {
    return `Only ${formatDuration(remainingMinutes)} left of the ${DAILY_LIMIT_HOURS}h daily limit.`
  }
  return null
}

/**
 * A start can't sit inside an entry (it may begin exactly when one ends), needs at
 * least one step left in the day to finish, and can't come before `earliest`.
 */
function isStartTaken(entries: LogEntry[], minutes: number, earliest: number | null) {
  if (minutes >= LAST_SELECTABLE_MINUTE) return true
  if (earliest !== null && minutes < earliest) return true
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
  /** The day being logged; its unsaved description is cached under this key. */
  dateKey: string
  entries: LogEntry[]
  remainingMinutes: number
  /** Logged time past the daily limit; 0 unless the day is over it. */
  overtimeMinutes: number
  /** The day's actual time in from N-PAX (minutes of the day), or null if unknown. */
  timeInMinutes: number | null
  /** When set, the draft edits this entry instead of creating a new one. */
  editingEntry: LogEntry | null
  onAdd: (draft: EntryDraft) => void
  onUpdate: (id: string, draft: EntryDraft) => void
}

export function useEntryDraft({
  dateKey,
  entries,
  remainingMinutes,
  overtimeMinutes,
  timeInMinutes,
  editingEntry,
  onAdd,
  onUpdate,
}: UseEntryDraftOptions) {
  // While editing, the entry's own slot and hours are free to reuse.
  const otherEntries = editingEntry ? entries.filter((e) => e.id !== editingEntry.id) : entries
  const availableMinutes = editingEntry
    ? remainingMinutes + workMinutes(editingEntry.startMinutes, editingEntry.endMinutes)
    : remainingMinutes

  // The day's first entry can't start before the N-PAX shift start; later ones can.
  const earliestStart = otherEntries.length === 0 ? timeInMinutes : null

  const [range, setRange] = useState(() =>
    editingEntry
      ? { startMinutes: editingEntry.startMinutes, endMinutes: editingEntry.endMinutes }
      : suggestRange(entries, remainingMinutes, timeInMinutes),
  )
  const [description, setDescriptionState] = useState(() => editingEntry?.description ?? readCachedDescription(dateKey))
  // Only a new entry's text is cached; an edit starts from the saved entry.
  const setDescription = (value: string) => {
    setDescriptionState(value)
    if (!editingEntry) writeCachedDescription(dateKey, value)
  }
  const jobs = useJobsStore((s) => s.jobs)
  const [job, setJob] = useState<Job | null>(() => findJob(jobs, editingEntry?.jobCode ?? null))
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
        : suggestRange(entries, remainingMinutes, timeInMinutes),
    )
    setDescriptionState(editingEntry?.description ?? readCachedDescription(dateKey))
    // A fresh entry keeps the last job and activity; most tasks in a row share them.
    if (editingEntry) {
      setJob(findJob(jobs, editingEntry.jobCode))
      setWorkActivity(findWorkActivity(editingEntry.workActivityCode))
    }
  }

  // The time in loads after the form opens: move the suggestion to it, unless the
  // wheels were already moved (by hand or by the timer) or an entry is being edited.
  const [syncedTimeIn, setSyncedTimeIn] = useState(timeInMinutes)
  if (timeInMinutes !== syncedTimeIn) {
    setSyncedTimeIn(timeInMinutes)
    const previous = suggestRange(entries, remainingMinutes, syncedTimeIn)
    if (!editingEntry && range.startMinutes === previous.startMinutes && range.endMinutes === previous.endMinutes) {
      setRange(suggestRange(entries, remainingMinutes, timeInMinutes))
    }
  }

  // Lunch doesn't count, so a task spanning it is shorter than its clock span.
  const durationMinutes = workMinutes(range.startMinutes, range.endMinutes)
  const issue = findIssue(range.startMinutes, range.endMinutes, otherEntries, availableMinutes, overtimeMinutes)
  // Exactly at the limit is the goal, not an error: the form shows it in green.
  const limitMet = availableMinutes === 0 && overtimeMinutes === 0
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
    /** The daily limit is used up, so a new entry can't be written (editing one still can). */
    isDayFull: editingEntry === null && availableMinutes === 0,
    startMinutes: range.startMinutes,
    endMinutes: range.endMinutes,
    setStartMinutes: (startMinutes: number) => setRange((r) => followStart(r, startMinutes, otherEntries)),
    setEndMinutes: (endMinutes: number) => setRange((r) => ({ ...r, endMinutes })),
    /** Keeps the start and moves the finish so the task counts `minutes` of work. */
    setDurationMinutes: (minutes: number) =>
      setRange((r) => ({ ...r, endMinutes: finishForWork(r.startMinutes, minutes) })),
    /** Sets both times at once (e.g. from the task timer). */
    setTimes: (startMinutes: number, endMinutes: number) => setRange({ startMinutes, endMinutes }),
    isStartTaken: (minutes: number) => isStartTaken(otherEntries, minutes, earliestStart),
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
    /** The issue is only that the day's hours are exactly met. */
    limitMet,
    canSubmit,
    submit,
  }
}
