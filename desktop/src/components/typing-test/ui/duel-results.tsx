import { Crown, Loader2, LogOut, RotateCcw, Swords } from 'lucide-react'
import { motion } from 'motion/react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { DuelMatch } from '@/types/typing-duel'
import type { TypingResult } from '@/types/typing-test'

interface DuelResultsProps {
  match: DuelMatch
  /** The user's own run, measured here; the opponent's comes from the server. */
  result: TypingResult | null
  onRematch: () => void
  onLeave: () => void
}

function Side({
  name,
  wpm,
  accuracy,
  won,
  tone,
}: {
  name: string
  wpm: number | null
  accuracy: number | null
  won: boolean
  tone: 'you' | 'opponent'
}) {
  return (
    <div className={cn('flex flex-col items-center gap-3', tone === 'you' ? 'text-foreground' : 'text-score')}>
      <span className="flex items-center gap-1.5 text-[13px]">
        {won && <Crown className="size-3.5" />}
        {name}
      </span>
      <span className="text-6xl leading-none font-semibold tabular-nums">{wpm !== null ? Math.round(wpm) : '—'}</span>
      <span className="text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
        wpm · {accuracy !== null ? `${Math.round(accuracy)}% acc` : 'acc —'}
      </span>
    </div>
  )
}

/** The end of a race: who won, both runs side by side, and a rematch both have to ask for. */
export function DuelResults({ match, result, onRematch, onLeave }: DuelResultsProps) {
  const { you, opponent, winner } = match
  const headline = winner === 'you' ? 'You win!' : winner === 'opponent' ? `${opponent.name} wins` : 'Draw'
  // Until the opponent's report lands, their last live pace stands in.
  const opponentWpm = opponent.result?.wpm ?? (opponent.progress.wpm || null)

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="flex flex-col items-center gap-10 font-mono"
    >
      <div className="flex flex-col items-center gap-2">
        <motion.h2
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 420, damping: 18, delay: 0.1 }}
          className={cn('text-4xl font-semibold', winner === 'you' ? 'text-score' : 'text-foreground')}
        >
          {headline}
        </motion.h2>
        <span className="flex items-center gap-2 text-[13px] text-muted-foreground tabular-nums">
          <Swords className="size-3.5" /> {you.points} – {opponent.points}
        </span>
      </div>

      <div className="grid w-full max-w-lg grid-cols-2 gap-8">
        <Side name="you" wpm={result?.wpm ?? you.result?.wpm ?? null} accuracy={result?.accuracy ?? null} won={winner === 'you'} tone="you" />
        <Side
          name={opponent.name}
          wpm={opponentWpm}
          accuracy={opponent.result?.accuracy ?? null}
          won={winner === 'opponent'}
          tone="opponent"
        />
      </div>

      <div className="flex flex-col items-center gap-3">
        <div className="flex gap-2">
          <Button onClick={onRematch} disabled={you.rematch}>
            {you.rematch ? <Loader2 className="animate-spin" /> : <RotateCcw />}
            {you.rematch ? `Waiting for ${opponent.name}` : 'Rematch'}
          </Button>
          <Button variant="ghost" onClick={onLeave}>
            <LogOut /> Leave
          </Button>
        </div>
        {opponent.rematch && !you.rematch && (
          <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[12px] text-score">
            {opponent.name} wants a rematch
          </motion.span>
        )}
      </div>
    </motion.section>
  )
}
