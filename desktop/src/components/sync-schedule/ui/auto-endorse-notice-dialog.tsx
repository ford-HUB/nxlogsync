import { Info } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { formatDayOfMonth } from '@/constants/sync-schedule'

interface AutoEndorseNoticeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  dayOfMonth: number
}

/** Shown once auto-endorse is saved: only full 9h days get endorsed. */
export function AutoEndorseNoticeDialog({ open, onOpenChange, dayOfMonth }: AutoEndorseNoticeDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Info className="size-4 text-primary" />
            Auto-endorse is on
          </AlertDialogTitle>
          <AlertDialogDescription className="text-[13px]">
            At 11:59 PM on the {formatDayOfMonth(dayOfMonth)} of each month (or the last day, in a shorter month),
            NXLogSync will endorse your synced days to your checker on its own and email you what was endorsed.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="rounded-lg border border-warning/40 bg-warning/10 px-3 py-2.5 text-[13px]">
          Only days that meet the <span className="font-medium">9-hour requirement</span> are endorsed. Days under 9h, or
          still waiting for a sync, are skipped and left for you to fix and endorse by hand.
        </div>

        <AlertDialogFooter>
          <AlertDialogAction>Got it</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
