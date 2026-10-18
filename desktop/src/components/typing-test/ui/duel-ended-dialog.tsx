import { Flag, UserX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { DuelMatch } from '@/types/typing-duel'

interface DuelEndedDialogProps {
  match: DuelMatch
  /** Back to the lobby; Enter or Escape too. */
  onClose: () => void
}

/** Tells the user their opponent left and the 1v1 is over, with the final score. */
export function DuelEndedDialog({ match, onClose }: DuelEndedDialogProps) {
  const { you, opponent, closedReason } = match
  const forfeit = closedReason === 'forfeit'
  const outcome = you.points > opponent.points ? 'You won the 1v1' : you.points < opponent.points ? `${opponent.name} won the 1v1` : 'The 1v1 ended level'

  return (
    <Dialog open={match.phase === 'closed'} onOpenChange={(open) => !open && onClose()}>
      <DialogContent showCloseButton={false} onInteractOutside={(e) => e.preventDefault()} className="font-mono sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserX className="size-4" /> Game over
          </DialogTitle>
          <DialogDescription>
            {forfeit
              ? `${opponent.name} left in the middle of the race, so the game has ended. That race doesn't count for either of you.`
              : `${opponent.name} left the 1v1, so the game has ended.`}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-2 rounded-lg border bg-muted/40 py-4">
          <span className="text-[10px] tracking-[0.14em] text-muted-foreground uppercase">final score</span>
          <span className="flex items-baseline gap-3 tabular-nums">
            <span className="text-3xl font-semibold text-foreground">{you.points}</span>
            <span className="text-muted-foreground">:</span>
            <span className="text-3xl font-semibold text-score">{opponent.points}</span>
          </span>
          <span className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
            <Flag className="size-3" /> {outcome}
          </span>
        </div>

        <DialogFooter>
          <Button autoFocus onClick={onClose}>
            Back to lobby
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
