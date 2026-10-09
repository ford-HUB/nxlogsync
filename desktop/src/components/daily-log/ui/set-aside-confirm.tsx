import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { formatClock } from '@/constants/time-format'
import type { LogEntry } from '@/types/daily-log'

interface SetAsideConfirmProps {
  /** The task held over the Trash; null keeps the dialog closed. */
  entry: LogEntry | null
  onConfirm: () => void
  onCancel: () => void
}

/** Asked on the first drag into the Trash each day, so a task isn't set aside by accident. */
export function SetAsideConfirm({ entry, onConfirm, onCancel }: SetAsideConfirmProps) {
  return (
    <AlertDialog open={entry !== null} onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Set this task aside?</AlertDialogTitle>
          <AlertDialogDescription>
            {entry && (
              <>
                <strong className="font-semibold text-foreground">
                  {formatClock(entry.startMinutes)} – {formatClock(entry.endMinutes)}
                </strong>{' '}
                · {entry.description}
                <br />
              </>
            )}
            Moves to the <strong className="font-semibold text-foreground">Trash</strong> until restored. Asked{' '}
            <strong className="font-semibold text-foreground">once a day</strong>.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              // The dialog closes once the drag moves on; closing here would also fire onCancel.
              e.preventDefault()
              onConfirm()
            }}
          >
            Set aside
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
