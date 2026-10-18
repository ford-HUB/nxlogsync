import { Check, Swords, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DUEL_NOTICE_SHOWN_MS } from '@/constants/typing-duel'
import { useSecondsLeft, useTypingDuelConnection } from '@/hooks/use-typing-duel'
import { useTypingDuelStore } from '@/store/typing-duel-store'
import type { DuelInvite } from '@/types/typing-duel'

function InviteBody({ invite, waiting }: { invite: DuelInvite; waiting: number }) {
  const seconds = useSecondsLeft(invite.expiresAt)
  // The bar drains over the time the invite had left when it was shown.
  const [msLeft] = useState(() => Math.max(0, invite.expiresAt - Date.now()))
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3 rounded-lg border bg-muted/40 p-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-foreground text-background">
          <Swords className="size-5" />
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-[15px] font-semibold text-foreground">{invite.from.name}</span>
          <span className="text-[12px] text-muted-foreground">wants to race you</span>
        </span>
        <span className="flex flex-col items-end">
          <span className="text-2xl leading-none font-semibold text-score tabular-nums">{seconds}</span>
          <span className="text-[10px] tracking-[0.14em] text-muted-foreground uppercase">sec</span>
        </span>
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-muted">
        <motion.div
          key={invite.id}
          initial={{ scaleX: 1 }}
          animate={{ scaleX: 0 }}
          transition={{ duration: msLeft / 1000, ease: 'linear' }}
          className="h-full origin-left bg-score"
        />
      </div>
      {waiting > 0 && (
        <span className="text-[12px] text-muted-foreground">
          +{waiting} more invite{waiting > 1 ? 's' : ''} waiting
        </span>
      )}
    </div>
  )
}

/**
 * Keeps the user online for typing 1v1s from the moment the app opens (with an account
 * connected), and asks about each invite in a modal: accept or decline before it expires. When
 * the app is minimised or in the tray, a notification card brings the user here (see the store).
 * Accepting starts the 1v1, and the app opens the typing test on it.
 */
export function DuelInvites() {
  useTypingDuelConnection()
  const incoming = useTypingDuelStore((s) => s.incoming)
  const respond = useTypingDuelStore((s) => s.respond)
  const [failure, setFailure] = useState<string | null>(null)
  useEffect(() => {
    if (!failure) return
    const id = window.setTimeout(() => setFailure(null), DUEL_NOTICE_SHOWN_MS)
    return () => window.clearTimeout(id)
  }, [failure])

  // Oldest first; the rest wait their turn.
  const invite = incoming[0]

  const answer = async (accept: boolean) => {
    if (!invite) return
    const message = await respond(invite.id, accept)
    if (accept && message) setFailure(message)
  }

  return (
    <>
      <Dialog
        open={invite !== undefined}
        onOpenChange={(open) => {
          // Escape declines.
          if (!open) void answer(false)
        }}
      >
        <DialogContent
          showCloseButton={false}
          onInteractOutside={(e) => e.preventDefault()}
          className="font-mono sm:max-w-sm"
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Swords className="size-4" /> Typing 1v1 invite
            </DialogTitle>
            <DialogDescription>
              {invite ? `${invite.from.name} challenges you to a typing race.` : ''} Answer before the time runs out.
            </DialogDescription>
          </DialogHeader>
          {invite && <InviteBody key={invite.id} invite={invite} waiting={incoming.length - 1} />}
          <DialogFooter>
            <Button variant="outline" onClick={() => void answer(false)}>
              <X /> Decline
            </Button>
            <Button autoFocus onClick={() => void answer(true)}>
              <Check /> Accept
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AnimatePresence>
        {failure && (
          <motion.button
            type="button"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            onClick={() => setFailure(null)}
            className="fixed top-4 left-1/2 z-[60] -translate-x-1/2 rounded-full border bg-popover px-3.5 py-1.5 font-mono text-[12px] text-destructive shadow-sm"
          >
            {failure}
          </motion.button>
        )}
      </AnimatePresence>
    </>
  )
}
