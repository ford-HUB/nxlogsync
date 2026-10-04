import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode } from 'react'
import { AlertCircle, ArrowRight, BriefcaseBusiness, Check, ChevronRight, ListChecks, Plus, type LucideIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  DESCRIPTION_MAX_LENGTH,
  LAST_SELECTABLE_MINUTE,
  TIME_STEP_MINUTES,
  WHEEL_ITEM_HEIGHT,
  WHEEL_VISIBLE_ITEMS,
} from '@/constants/daily-log'
import { formatClock, formatDuration } from '@/constants/time-format'
import { useEntryDraft } from '@/hooks/use-entry-draft'
import { useTaskTimer } from '@/hooks/use-task-timer'
import type { EntryDraft, LogEntry } from '@/types/daily-log'
import { cn } from '@/lib/utils'
import { TimePicker } from '@/components/time-picker/time-picker'
import { JobLookupDialog } from './job-lookup-dialog'
import { TaskTimer } from './ui/task-timer'
import { WorkActivityLookupDialog } from './work-activity-lookup-dialog'

/** Wheel viewport plus the picker's 1px top/bottom border. */
const WHEEL_BOX_HEIGHT = WHEEL_ITEM_HEIGHT * WHEEL_VISIBLE_ITEMS + 2

const minutesOfDay = (date: Date) => date.getHours() * 60 + date.getMinutes()

/**
 * Wheel times for a timed run: start rounded down and finish rounded up to the
 * wheel step, at least one step long. A run past midnight finishes at the last
 * time the wheels allow.
 */
function timerRange(startedAt: Date, stoppedAt: Date) {
  const start = Math.min(
    Math.floor(minutesOfDay(startedAt) / TIME_STEP_MINUTES) * TIME_STEP_MINUTES,
    LAST_SELECTABLE_MINUTE - TIME_STEP_MINUTES,
  )
  const sameDay = stoppedAt.toDateString() === startedAt.toDateString()
  const rawEnd = sameDay
    ? Math.ceil((minutesOfDay(stoppedAt) + stoppedAt.getSeconds() / 60) / TIME_STEP_MINUTES) * TIME_STEP_MINUTES
    : LAST_SELECTABLE_MINUTE
  const end = Math.min(Math.max(rawEnd, start + TIME_STEP_MINUTES), LAST_SELECTABLE_MINUTE)
  return { start, end }
}

interface EntryFormProps {
  entries: LogEntry[]
  remainingMinutes: number
  /** The task timer only runs against today's log. */
  isToday: boolean
  editingEntry: LogEntry | null
  onAdd: (draft: EntryDraft) => void
  onUpdate: (id: string, draft: EntryDraft) => void
  onCancelEdit: () => void
}

export function EntryForm({
  entries,
  remainingMinutes,
  isToday,
  editingEntry,
  onAdd,
  onUpdate,
  onCancelEdit,
}: EntryFormProps) {
  const draft = useEntryDraft({ entries, remainingMinutes, editingEntry, onAdd, onUpdate })
  const formRef = useRef<HTMLFormElement>(null)
  const descriptionRef = useRef<HTMLTextAreaElement>(null)
  const [jobLookupOpen, setJobLookupOpen] = useState(false)
  const [activityLookupOpen, setActivityLookupOpen] = useState(false)
  const timer = useTaskTimer()

  // A running timer owns the Started wheel: set it when the timer starts (or is
  // restored after a reload, or an edit ends), with the finish one step after.
  // Updating state during render keeps the wheels animating instead of remounting them.
  const runStart = timer.running && !editingEntry ? (timer.startedAt?.getTime() ?? null) : null
  const [syncedRunStart, setSyncedRunStart] = useState<number | null>(null)
  if (runStart !== syncedRunStart) {
    setSyncedRunStart(runStart)
    if (runStart !== null) {
      const { start, end } = timerRange(new Date(runStart), new Date(runStart))
      draft.setTimes(start, end)
    }
  }

  // Stop fills the wheels with the timed run, then hands over to the description.
  const stopTimer = () => {
    const run = timer.stop()
    if (!run) return
    const { start, end } = timerRange(run.startedAt, run.stoppedAt)
    draft.setTimes(start, end)
    descriptionRef.current?.focus()
  }

  // Picking a task in the list (below) brings the form into view, ready to type.
  const editingId = editingEntry?.id
  useEffect(() => {
    if (!editingId) return
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    descriptionRef.current?.focus({ preventScroll: true })
  }, [editingId])

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    draft.submit()
  }

  // Enter adds the entry; Shift+Enter keeps a newline in the description.
  const handleDescriptionKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) return
    event.preventDefault()
    draft.submit()
  }

  const handleFormKeyDown = (event: KeyboardEvent<HTMLFormElement>) => {
    if (event.key === 'Escape' && draft.isEditing) onCancelEdit()
  }

  return (
    <Card
      data-editing={draft.isEditing || undefined}
      className="shrink-0 gap-0 py-0 shadow-sm transition-shadow data-editing:ring-2 data-editing:ring-primary/25"
    >
      <form ref={formRef} onSubmit={handleSubmit} onKeyDown={handleFormKeyDown} className="flex scroll-m-4 flex-col">
        <CardHeader className="border-b py-4">
          <CardTitle>{editingEntry ? 'Edit entry' : 'New entry'}</CardTitle>
          <CardDescription className="text-[12px]">
            {editingEntry
              ? `Changing the ${formatClock(editingEntry.startMinutes)} – ${formatClock(editingEntry.endMinutes)} task. Press Update to save, or Esc to cancel.`
              : timer.running && isToday
                ? 'Timer running from the Started time. Press Stop when the task is done to fill in its finish.'
                : 'Scroll the wheels to set the time, or press Start to time the task. Describe it, then press Enter or Add. Times already logged are crossed out.'}
          </CardDescription>
          {(editingEntry || isToday) && (
            <CardAction className="flex items-center gap-2">
              {editingEntry && <Badge variant="secondary">Editing</Badge>}
              {isToday && (
                <TaskTimer
                  running={timer.running}
                  startedAt={timer.startedAt}
                  elapsedMs={timer.elapsedMs}
                  onStart={timer.start}
                  onStop={stopTimer}
                  stopBlockedReason={editingEntry ? 'Finish or cancel the edit first' : undefined}
                />
              )}
            </CardAction>
          )}
        </CardHeader>

        <CardContent className="flex flex-col gap-3 py-4">
          <div className="grid gap-x-4 gap-y-3 sm:grid-cols-2">
            <div className="flex min-w-0 flex-col gap-1.5">
              <Label htmlFor="entry-job" className="text-[11px] tracking-wider text-muted-foreground uppercase">
                Job
              </Label>
              <LookupButton id="entry-job" icon={BriefcaseBusiness} onClick={() => setJobLookupOpen(true)}>
                {draft.job ? (
                  <>
                    <span className="shrink-0 font-medium tabular-nums">{draft.job.code}</span>
                    <span className="min-w-0 truncate text-muted-foreground">{draft.job.clientJobName}</span>
                  </>
                ) : (
                  <span className="text-muted-foreground">Select a job…</span>
                )}
              </LookupButton>
              <JobLookupDialog open={jobLookupOpen} onOpenChange={setJobLookupOpen} value={draft.job} onSelect={draft.setJob} />
            </div>

            <div className="flex min-w-0 flex-col gap-1.5">
              <Label htmlFor="entry-work-activity" className="text-[11px] tracking-wider text-muted-foreground uppercase">
                Work activity
              </Label>
              <LookupButton
                id="entry-work-activity"
                icon={ListChecks}
                onClick={() => setActivityLookupOpen(true)}
                disabled={!draft.job}
              >
                {!draft.job ? (
                  <span className="text-muted-foreground">Select a job first</span>
                ) : draft.workActivity ? (
                  <>
                    <span className="shrink-0 font-medium">{draft.workActivity.code}</span>
                    <span className="min-w-0 truncate text-muted-foreground">{draft.workActivity.name}</span>
                  </>
                ) : (
                  <span className="text-muted-foreground">Select a work activity…</span>
                )}
              </LookupButton>
              <WorkActivityLookupDialog
                open={activityLookupOpen}
                onOpenChange={setActivityLookupOpen}
                value={draft.workActivity}
                onSelect={draft.setWorkActivity}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-end gap-x-4 gap-y-3">
            <div className="flex items-end gap-3">
              <TimePicker label="Started" value={draft.startMinutes} onChange={draft.setStartMinutes} isTaken={draft.isStartTaken} invalid={draft.issue !== null} />
              <div aria-hidden className="flex items-center" style={{ height: WHEEL_BOX_HEIGHT }}>
                <ArrowRight className="size-4 text-muted-foreground" />
              </div>
              <TimePicker label="Finished" value={draft.endMinutes} onChange={draft.setEndMinutes} isTaken={draft.isEndTaken} invalid={draft.issue !== null} />
            </div>

            <div className="flex min-w-60 flex-1 flex-col gap-1.5">
              <div className="flex items-baseline justify-between gap-2">
                <Label htmlFor="entry-description" className="text-[11px] tracking-wider text-muted-foreground uppercase">
                  Task description
                </Label>
                <span className="text-[11px] text-muted-foreground tabular-nums">
                  {draft.description.length}/{DESCRIPTION_MAX_LENGTH}
                </span>
              </div>
              <Textarea
                ref={descriptionRef}
                id="entry-description"
                value={draft.description}
                // Workflow stores allocation descriptions in uppercase.
                onChange={(e) => draft.setDescription(e.target.value.toUpperCase())}
                onKeyDown={handleDescriptionKeyDown}
                maxLength={DESCRIPTION_MAX_LENGTH}
                placeholder="What did you work on?"
                className="min-h-0 resize-none text-[13px]"
                style={{ height: WHEEL_BOX_HEIGHT }}
              />
            </div>

          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-3 text-[12px]">
            <span className="shrink-0 text-muted-foreground">
              Duration <span className="font-semibold text-foreground tabular-nums">{formatDuration(draft.durationMinutes)}</span>
            </span>
            <span aria-hidden className="h-3 w-px bg-border" />
            {draft.issue ? (
              <span role="alert" className="flex min-w-0 items-center gap-1.5 text-destructive">
                <AlertCircle className="size-3.5 shrink-0" />
                <span className="truncate">{draft.issue}</span>
              </span>
            ) : (
              <span className="truncate text-muted-foreground tabular-nums">
                {formatDuration(draft.availableMinutes)} left today
                {draft.missing && ` · Pick ${draft.missing} to save`}
              </span>
            )}
            <div className={cn('ml-auto flex w-full gap-2 sm:w-auto', draft.isEditing && '*:flex-1 sm:*:flex-none')}>
              {draft.isEditing && (
                <Button type="button" variant="outline" onClick={onCancelEdit}>
                  Cancel
                </Button>
              )}
              <Button type="submit" className="flex-1 sm:flex-none" disabled={!draft.canSubmit}>
                {draft.isEditing ? <Check /> : <Plus />}
                {draft.isEditing ? 'Update entry' : 'Add entry'}
              </Button>
            </div>
          </div>
        </CardContent>
      </form>
    </Card>
  )
}

interface LookupButtonProps {
  id: string
  icon: LucideIcon
  onClick: () => void
  disabled?: boolean
  children: ReactNode
}

/** A field-styled button that opens a lookup dialog and shows the current pick. */
function LookupButton({ id, icon: Icon, onClick, disabled, children }: LookupButtonProps) {
  return (
    <button
      id={id}
      type="button"
      aria-haspopup="dialog"
      onClick={onClick}
      disabled={disabled}
      className="flex h-9 w-full min-w-0 cursor-pointer items-center gap-2.5 rounded-lg border bg-background px-3 text-left text-[13px] transition-colors outline-none hover:bg-muted/50 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:bg-muted/40 disabled:opacity-60 disabled:hover:bg-muted/40"
    >
      <Icon className="size-4 shrink-0 text-muted-foreground" />
      {children}
      <ChevronRight className="ml-auto size-4 shrink-0 text-muted-foreground" />
    </button>
  )
}
