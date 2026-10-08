import { AlertCircle, BellRing, Loader2, Mail, RefreshCw, Send } from 'lucide-react'
import { TimePicker } from '@/components/time-picker/time-picker'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { REMINDER_EMAIL_SOURCE, REMINDER_HINT } from '@/constants/reminders'
import { useReminders } from '@/hooks/use-reminders'
import { cn } from '@/lib/utils'
import { WeekdayPicker } from './ui/weekday-picker'

interface ReminderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** Email reminder to log the day's hours, sent by the server to the address N-PAX holds. */
export function ReminderDialog({ open, onOpenChange }: ReminderDialogProps) {
  const r = useReminders(open)
  const busy = r.fetchingEmail || r.testing

  // Closing without saving drops the unsaved changes.
  const handleOpenChange = (next: boolean) => {
    if (!next) r.discard()
    onOpenChange(next)
  }

  const handleSave = async () => {
    if (await r.save()) onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="w-full gap-4 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reminder</DialogTitle>
          <DialogDescription className="text-[12px]">{REMINDER_HINT}</DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-3 rounded-lg border px-3 py-2.5">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
            {r.fetchingEmail ? (
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
            ) : (
              <Mail className="size-4 text-muted-foreground" />
            )}
          </div>
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-[13px] font-medium">
              {r.fetchingEmail ? 'Reading from N-PAX…' : (r.email ?? 'No email found')}
            </span>
            <span className="truncate text-[12px] text-muted-foreground">{REMINDER_EMAIL_SOURCE}</span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Read the email from N-PAX again"
            onClick={r.refreshEmail}
            disabled={!r.loaded || busy}
          >
            <RefreshCw />
          </Button>
        </div>

        <div className="flex items-center gap-2.5">
          <Switch
            id="reminder-enabled"
            checked={r.draft.enabled}
            onCheckedChange={(enabled) => r.update({ enabled })}
            disabled={!r.loaded}
          />
          <Label htmlFor="reminder-enabled" className="text-[13px] font-normal">
            Email me a reminder
          </Label>
        </div>

        <div className={cn('flex flex-col gap-4', !r.draft.enabled && 'opacity-50')}>
          <TimePicker label="Remind at" value={r.draft.atMinutes} onChange={(atMinutes) => r.update({ atMinutes })} />
          <WeekdayPicker value={r.draft.days} onToggle={r.toggleDay} invalid={r.issue !== null} ariaLabel="Reminder days" />
        </div>

        {(r.issue ?? r.error) && (
          <p role="alert" className="flex items-center gap-1.5 text-[12px] text-destructive">
            <AlertCircle className="size-3.5 shrink-0" />
            {r.issue ?? r.error}
          </p>
        )}
        {r.testSentTo && !r.error && (
          <p className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
            <BellRing className="size-3.5 shrink-0" />
            Test reminder sent to {r.testSentTo}
          </p>
        )}

        <DialogFooter className="sm:justify-between">
          <Button type="button" variant="outline" onClick={r.sendTest} disabled={!r.loaded || busy}>
            {r.testing ? <Loader2 className="animate-spin" /> : <Send />}
            Send test
          </Button>
          <Button type="button" onClick={() => void handleSave()} disabled={!r.isDirty || r.saving || r.issue !== null}>
            {r.saving && <Loader2 className="animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
