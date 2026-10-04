import { AlertCircle, ArrowRight, CalendarClock } from 'lucide-react'
import { TimePicker } from '@/components/time-picker/time-picker'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { WHEEL_ITEM_HEIGHT, WHEEL_VISIBLE_ITEMS } from '@/constants/daily-log'
import {
  formatMonthlyOffset,
  formatRunTime,
  INTERVAL_HOUR_OPTIONS,
  LOCAL_TIME_ZONE,
  MONTHLY_OFFSET_OPTIONS,
  RETRY_OPTIONS,
  SCHEDULE_ISSUE_MESSAGE,
  SCHEDULE_MODE_HINT,
  SCHEDULE_MODE_LABEL,
  SCHEDULE_MODES,
} from '@/constants/sync-schedule'
import type { SyncScheduleState } from '@/hooks/use-sync-schedule'
import type { ScheduleMode } from '@/types/sync-schedule'
import { WeekdayPicker } from './ui/weekday-picker'

/** Wheel viewport plus the picker's 1px top/bottom border. */
const WHEEL_BOX_HEIGHT = WHEEL_ITEM_HEIGHT * WHEEL_VISIBLE_ITEMS + 2
const FIELD_LABEL = 'text-[11px] tracking-wider text-muted-foreground uppercase'

interface ScheduleFormProps {
  schedule: SyncScheduleState
}

export function ScheduleForm({ schedule: s }: ScheduleFormProps) {
  const { draft, update } = s
  const issue = s.issue === 'invalid-url' ? null : s.issue

  return (
    <Card className="gap-0 py-0 shadow-sm">
      <CardHeader className="border-b py-4">
        <CardTitle>When to sync</CardTitle>
        <CardDescription className="text-[12px]">{SCHEDULE_MODE_HINT[draft.mode]}</CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-5 py-4">
        <ToggleGroup
          type="single"
          variant="outline"
          spacing={0}
          value={draft.mode}
          onValueChange={(mode) => mode && update({ mode: mode as ScheduleMode })}
          aria-label="Schedule type"
        >
          {SCHEDULE_MODES.map((mode) => (
            <ToggleGroupItem key={mode} value={mode} className="px-3 text-[13px]">
              {SCHEDULE_MODE_LABEL[mode]}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>

        {draft.mode !== 'manual' && (
          <div className="flex flex-wrap items-end gap-x-6 gap-y-4">
            {draft.mode === 'monthly' ? (
              <MonthlyFields schedule={s} />
            ) : draft.mode === 'daily' ? (
              <TimePicker label="Sync at" value={draft.dailyAtMinutes} onChange={(m) => update({ dailyAtMinutes: m })} />
            ) : (
              <div className="flex flex-wrap items-end gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="interval-hours" className={FIELD_LABEL}>Every</Label>
                  <div className="flex items-center" style={{ height: WHEEL_BOX_HEIGHT }}>
                    <Select value={String(draft.intervalHours)} onValueChange={(v) => update({ intervalHours: Number(v) })}>
                      <SelectTrigger id="interval-hours" className="w-28 text-[13px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {INTERVAL_HOUR_OPTIONS.map((h) => (
                          <SelectItem key={h} value={String(h)}>
                            {h === 1 ? '1 hour' : `${h} hours`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <TimePicker
                  label="From"
                  value={draft.windowStartMinutes}
                  onChange={(m) => update({ windowStartMinutes: m })}
                  invalid={issue === 'window-order'}
                />
                <div aria-hidden className="flex items-center" style={{ height: WHEEL_BOX_HEIGHT }}>
                  <ArrowRight className="size-4 text-muted-foreground" />
                </div>
                <TimePicker
                  label="Until"
                  value={draft.windowEndMinutes}
                  onChange={(m) => update({ windowEndMinutes: m })}
                  invalid={issue === 'window-order'}
                />
              </div>
            )}

            {draft.mode !== 'monthly' && (
              <WeekdayPicker value={draft.days} onToggle={s.toggleDay} invalid={issue === 'no-days'} />
            )}
          </div>
        )}

        {issue && (
          <p role="alert" className="flex items-center gap-1.5 text-[12px] text-destructive">
            <AlertCircle className="size-3.5" />
            {SCHEDULE_ISSUE_MESSAGE[issue]}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-t pt-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="retry-attempts" className="text-[13px] font-normal">If an upload fails, retry</Label>
            <Select value={String(draft.retryAttempts)} onValueChange={(v) => update({ retryAttempts: Number(v) })}>
              <SelectTrigger id="retry-attempts" size="sm" className="text-[13px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RETRY_OPTIONS.map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n === 0 ? 'never' : n === 1 ? 'once' : `${n} times`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2.5">
            <Switch
              id="skip-empty"
              size="sm"
              checked={draft.skipEmptyDays}
              onCheckedChange={(skipEmptyDays) => update({ skipEmptyDays })}
            />
            <Label htmlFor="skip-empty" className="text-[13px] font-normal">Skip days with no entries</Label>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex-col items-start gap-2 py-3 sm:flex-row sm:items-center">
        <span className="flex shrink-0 items-center gap-1.5 text-[12px] text-muted-foreground">
          <CalendarClock className="size-3.5" />
          Upcoming
        </span>
        {s.previewRuns.length > 0 ? (
          <ul className="flex flex-wrap gap-1.5">
            {s.previewRuns.map((run) => (
              <li key={run.getTime()}>
                <Badge variant="outline" className="font-normal tabular-nums">{formatRunTime(run, s.now)}</Badge>
              </li>
            ))}
          </ul>
        ) : (
          <span className="text-[12px] text-muted-foreground">
            {draft.mode === 'manual' ? 'No automatic runs — sync manually.' : 'No runs in the next two weeks.'}
          </span>
        )}
        <span className="text-[11px] text-muted-foreground sm:ml-auto">Times in {LOCAL_TIME_ZONE}</span>
      </CardFooter>
    </Card>
  )
}

function MonthlyFields({ schedule: s }: ScheduleFormProps) {
  const { draft, update } = s

  return (
    <div className="flex flex-wrap items-end gap-x-6 gap-y-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="monthly-offset" className={FIELD_LABEL}>On</Label>
        <div className="flex items-center" style={{ height: WHEEL_BOX_HEIGHT }}>
          <Select
            value={String(draft.monthlyDaysBeforeEnd)}
            onValueChange={(v) => update({ monthlyDaysBeforeEnd: Number(v) })}
          >
            <SelectTrigger id="monthly-offset" className="w-64 text-[13px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTHLY_OFFSET_OPTIONS.map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {formatMonthlyOffset(n)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <TimePicker label="Sync at" value={draft.dailyAtMinutes} onChange={(m) => update({ dailyAtMinutes: m })} />
      <div className="flex items-center gap-2.5" style={{ height: WHEEL_BOX_HEIGHT }}>
        <Switch
          id="monthly-weekdays"
          size="sm"
          checked={draft.monthlyWeekdaysOnly}
          onCheckedChange={(monthlyWeekdaysOnly) => update({ monthlyWeekdaysOnly })}
        />
        <Label htmlFor="monthly-weekdays" className="text-[13px] font-normal">
          If it lands on a weekend, sync the Friday before
        </Label>
      </div>
    </div>
  )
}
