import { Link2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface ConnectRequiredDialogProps {
  open: boolean
  onOpenSettings: () => void
  onCancel: () => void
}

/**
 * Shown when the typing test is opened without a connected account: scores and the leaderboard
 * name belong to the account on the server, so nothing is lost if the app is reinstalled.
 */
export function ConnectRequiredDialog({ open, onOpenSettings, onCancel }: ConnectRequiredDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <DialogContent showCloseButton={false} className="font-mono">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="size-4" /> Connect your account first
          </DialogTitle>
          <DialogDescription>
            Your typing scores and leaderboard name are saved to your N-PAX account, so they&apos;re never lost if the
            app is reinstalled. Connect it in Settings to start typing.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onCancel}>
            Not now
          </Button>
          <Button type="button" autoFocus onClick={onOpenSettings}>
            Open Settings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
