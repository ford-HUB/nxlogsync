import { Check, Clock, Flag, LogOut, Vote } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DUEL_DURATIONS, DUEL_RACES } from '@/constants/typing-duel'
import { cn } from '@/lib/utils'
import type { DuelMatch, DuelVote } from '@/types/typing-duel'

interface DuelVoteDialogProps {
  match: DuelMatch
  onVote: (vote: DuelVote) => void
  onLeave: () => void
}

type Group = 'race' | 'time'

function VoterChip({ name, tone, group }: { name: string; tone: 'you' | 'opponent'; group: Group }) {
  return (
    <motion.span
      layoutId={`vote-${group}-${tone}`}
      transition={{ type: 'spring', stiffness: 500, damping: 34 }}
      className={cn(
        'flex max-w-full items-center gap-1 truncate rounded-sm px-1.5 py-0.5 text-[10px] font-semibold',
        tone === 'you' ? 'bg-foreground text-background' : 'bg-score text-background',
      )}
    >
      <Flag className="size-2.5 shrink-0" /> <span className="truncate">{name}</span>
    </motion.span>
  )
}

interface ChoiceProps {
  group: Group
  title: string
  detail?: string
  mine: boolean
  theirs: boolean
  opponentName: string
  onPick: () => void
  className?: string
}

function Choice({ group, title, detail, mine, theirs, opponentName, onPick, className }: ChoiceProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={mine}
      onClick={onPick}
      className={cn(
        'relative flex flex-col gap-1 rounded-lg border p-3 text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
        mine ? 'border-foreground bg-muted/60' : 'hover:border-foreground/30 hover:bg-muted/40',
        theirs && !mine && 'border-score/60',
        className,
      )}
    >
      <span className="flex items-center justify-between gap-2">
        <span className="text-[14px] font-semibold text-foreground tabular-nums">{title}</span>
        {mine && <Check className="size-4 text-foreground" />}
      </span>
      {detail && <span className="text-[12px] text-muted-foreground">{detail}</span>}
      <span className="mt-auto flex min-h-5 flex-wrap gap-1 pt-1.5">
        {mine && <VoterChip name="you" tone="you" group={group} />}
        {theirs && <VoterChip name={opponentName} tone="opponent" group={group} />}
      </span>
    </button>
  )
}

function Section({ icon, label, hint, children }: { icon: ReactNode; label: string; hint: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <span className="flex items-center justify-between gap-2 text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
        <span className="flex items-center gap-1.5">
          {icon} {label}
        </span>
        <span className="tracking-normal normal-case">{hint}</span>
      </span>
      {children}
    </section>
  )
}

/** "they picked X" for one part of the vote, or null while they haven't. */
function opponentNote(name: string, theirs: string | null, agreed: boolean) {
  if (!theirs) return null
  return (
    <>
      {name} {agreed ? 'agrees on' : 'wants'} <span className="text-score">{theirs}</span>
    </>
  )
}

/**
 * Before each race both players vote, live, on the race and on the time; each sees the other's
 * picks move as they change. It starts once both picked the same race and the same time. For
 * Speed the time is the race; for a words race it is the limit. Leaving ends the 1v1.
 */
export function DuelVoteDialog({ match, onVote, onLeave }: DuelVoteDialogProps) {
  const { you, opponent } = match
  const opponentRace = DUEL_RACES.find((r) => r.option === opponent.vote)
  const speed = (you.vote ?? opponent.vote) === 'speed'
  const raceAgreed = you.vote !== null && you.vote === opponent.vote
  const timeAgreed = you.durationVote !== null && you.durationVote === opponent.durationVote

  const raceNote = opponentNote(opponent.name, opponentRace?.label.toLowerCase() ?? null, raceAgreed)
  const timeNote = opponentNote(
    opponent.name,
    opponent.durationVote !== null ? `${opponent.durationVote}s` : null,
    timeAgreed,
  )

  return (
    <Dialog open={match.phase === 'voting'}>
      <DialogContent
        showCloseButton={false}
        // Only a vote or Leave closes it.
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
        className="font-mono sm:max-w-lg"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Vote className="size-4" /> Pick the race
            {match.round > 1 && <span className="text-[12px] font-normal text-muted-foreground">· round {match.round}</span>}
          </DialogTitle>
          <DialogDescription>
            You and {opponent.name} both have to pick the same race and the same time. It starts as soon as you agree.
          </DialogDescription>
        </DialogHeader>

        <Section icon={<Flag className="size-3" />} label="race" hint={raceAgreed ? 'agreed' : 'pick one'}>
          <div role="radiogroup" aria-label="Race" className="grid grid-cols-2 gap-2">
            {DUEL_RACES.map((race) => (
              <Choice
                key={race.option}
                group="race"
                title={race.label}
                detail={race.detail}
                mine={you.vote === race.option}
                theirs={opponent.vote === race.option}
                opponentName={opponent.name}
                onPick={() => onVote({ option: race.option })}
                className="min-h-20"
              />
            ))}
          </div>
        </Section>

        <Section
          icon={<Clock className="size-3" />}
          label={speed ? 'duration' : 'time limit'}
          hint={timeAgreed ? 'agreed' : speed ? 'how long the race lasts' : 'most correct wins if time runs out'}
        >
          <div role="radiogroup" aria-label="Time" className="grid grid-cols-4 gap-2">
            {DUEL_DURATIONS.map((seconds) => (
              <Choice
                key={seconds}
                group="time"
                title={`${seconds}s`}
                mine={you.durationVote === seconds}
                theirs={opponent.durationVote === seconds}
                opponentName={opponent.name}
                onPick={() => onVote({ duration: seconds })}
              />
            ))}
          </div>
        </Section>

        <p aria-live="polite" className="min-h-4 text-[12px] text-muted-foreground">
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={`${you.vote}-${opponent.vote}-${you.durationVote}-${opponent.durationVote}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {!raceNote && !timeNote ? (
                <>{opponent.name} is picking…</>
              ) : (
                <>
                  {raceNote}
                  {raceNote && timeNote && ' · '}
                  {timeNote}
                </>
              )}
            </motion.span>
          </AnimatePresence>
        </p>

        <DialogFooter className="sm:justify-between">
          <span className="hidden items-center text-[11px] text-muted-foreground sm:flex">
            Score {you.points} – {opponent.points}
          </span>
          <Button variant="ghost" onClick={onLeave}>
            <LogOut /> Leave 1v1
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
