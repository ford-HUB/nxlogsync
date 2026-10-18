import { MousePointerClick, Swords } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useMemo, useState } from 'react'
import { DUEL_ESCAPE_CONFIRM_MS, DUEL_RACES } from '@/constants/typing-duel'
import { useDuelRace } from '@/hooks/use-typing-duel'
import { useTypingKeys } from '@/hooks/use-typing-keys'
import { cn } from '@/lib/utils'
import { useTypingDuelStore } from '@/store/typing-duel-store'
import type { DuelMatch } from '@/types/typing-duel'
import { DuelEndedDialog } from './ui/duel-ended-dialog'
import { DuelResults } from './ui/duel-results'
import { DuelScoreboard } from './ui/duel-scoreboard'
import { DuelVoteDialog } from './ui/duel-vote-dialog'
import { LiveStats } from './ui/live-stats'
import { OnScreenKeyboard } from './ui/on-screen-keyboard'
import { WordsDisplay, type WordFlag } from './ui/words-display'

interface TypingDuelProps {
  match: DuelMatch
  /** Shown but not listening for keys. */
  paused?: boolean
}

/**
 * A 1v1 typing race, laid out like the solo test: the points and both racers' pace where the
 * leaderboard was, a vote on the race before each one, a 3‑2‑1, then the same words for both
 * with each racer's flag on the letter they're at.
 */
export function TypingDuel({ match, paused = false }: TypingDuelProps) {
  const { test, progress, countdown } = useDuelRace(match)
  const live = useTypingDuelStore((s) => s.live)
  const streamed = useTypingDuelStore((s) => s.opponentProgress)
  const vote = useTypingDuelStore((s) => s.vote)
  const rematch = useTypingDuelStore((s) => s.rematch)
  const leave = useTypingDuelStore((s) => s.leave)

  const { session, elapsedMs, liveWpm, liveAccuracy, result } = test
  const { phase, config, you, opponent } = match
  const opponentProgress = streamed ?? opponent.progress
  const racing = phase === 'racing'
  const finished = phase === 'finished'
  const race = DUEL_RACES.find((r) => r.option === match.option)

  // Mid-race, Escape asks to be pressed again: leaving is a forfeit.
  const [confirmEscape, setConfirmEscape] = useState(false)
  useEffect(() => {
    if (!confirmEscape) return
    const id = window.setTimeout(() => setConfirmEscape(false), DUEL_ESCAPE_CONFIRM_MS)
    return () => window.clearTimeout(id)
  }, [confirmEscape])

  const { focused, setFocused, pressed } = useTypingKeys({
    onKey: (e) => {
      if (racing) test.onKeyDown(e)
      else if (e.key === 'Tab') e.preventDefault()
    },
    onEscape: () => {
      if (racing && !confirmEscape) setConfirmEscape(true)
      else leave()
    },
    paused: paused || phase === 'voting' || phase === 'closed',
  })

  // How far along, for the scoreboard: a words race toward its last letter, a timed race relative to the leader.
  const totalChars = useMemo(() => session.words.reduce((n, w) => n + w.length + 1, 0), [session.words])
  const along = (correct: number) => {
    if (config?.mode === 'words') return Math.min(1, correct / Math.max(totalChars, 1))
    return correct / Math.max(progress.correct, opponentProgress.correct, 1)
  }
  const youAt = along(progress.correct)
  const opponentAt = along(opponentProgress.correct)

  const flags = useMemo<WordFlag[]>(
    () => [
      { id: 'opponent', word: opponentProgress.word, char: opponentProgress.char, label: opponent.name, tone: 'opponent' },
      { id: 'you', word: progress.word, char: progress.char, label: 'you', tone: 'you' },
    ],
    [opponentProgress.word, opponentProgress.char, opponent.name, progress.word, progress.char],
  )

  const elapsed = Math.floor(elapsedMs / 1000)
  // Time left either way: a words race has the voted time as its limit.
  const seconds = config ? Math.max(0, config.limit - elapsed) : 0

  return (
    <div className="relative min-h-dvh w-full">
      <div className="absolute inset-y-16 right-3 hidden w-[13.5rem] lg:block min-[1440px]:right-6 min-[1440px]:w-[22rem]">
        <DuelScoreboard
          match={match}
          live={live}
          you={{
            name: you.name,
            points: you.points,
            wpm: finished ? (result?.wpm ?? you.result?.wpm ?? 0) : liveWpm,
            accuracy: finished ? (result?.accuracy ?? null) : null,
            at: youAt,
          }}
          opponent={{
            name: opponent.name,
            points: opponent.points,
            wpm: opponent.result?.wpm ?? opponentProgress.wpm,
            accuracy: opponent.result?.accuracy ?? null,
            at: opponentAt,
          }}
        />
      </div>

      <div className="relative mx-auto flex min-h-dvh w-full max-w-5xl flex-col px-4 py-3 sm:px-8 lg:max-w-[min(64rem,calc(100vw-28.5rem))] min-[1440px]:max-w-[min(64rem,calc(100vw-50rem))] [@media(min-height:720px)]:py-6">
        <div className={cn('flex items-center justify-between gap-3 transition-opacity duration-200', racing && 'opacity-40')}>
          <div className="w-9" />
          <span className="flex items-center gap-2 rounded-lg bg-muted/60 px-3 py-1.5 font-mono text-[12px] text-muted-foreground">
            <Swords className="size-3.5" />
            <span className="text-foreground">1v1</span>
            {race && config && (
              <span>
                · {race.label.toLowerCase()} · {race.mode === 'words' ? `${race.detail} · ` : ''}
                {config.limit}s
              </span>
            )}
            <span>
              · vs <span className="text-score">{opponent.name}</span>
            </span>
          </span>
          <div className="w-9" />
        </div>

        <div className="flex flex-1 flex-col justify-center gap-4 py-4 [@media(min-height:720px)]:gap-10 [@media(min-height:720px)]:py-10">
          <AnimatePresence mode="wait" initial={false}>
            {finished ? (
              <motion.div key={`results-${match.round}`} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                <DuelResults match={match} result={result} onRematch={rematch} onLeave={leave} />
              </motion.div>
            ) : (
              <motion.div
                key={`race-${match.round}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="flex flex-col gap-4 [@media(min-height:720px)]:gap-8"
              >
                <LiveStats wpm={liveWpm} accuracy={liveAccuracy} seconds={seconds} idle={!racing} />

                <div className="relative" onClick={() => setFocused(true)}>
                  <div className={cn('transition-[filter] duration-200', phase !== 'racing' && 'blur-[2px]')}>
                    <WordsDisplay session={session} focused={focused || !racing} flags={config ? flags : undefined} />
                  </div>
                  <AnimatePresence>
                    {countdown > 0 && (
                      <motion.div
                        key={countdown}
                        initial={{ opacity: 0, scale: 1.6 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.6 }}
                        transition={{ type: 'spring', stiffness: 380, damping: 22 }}
                        className="absolute inset-0 flex items-center justify-center font-mono text-7xl font-semibold text-score tabular-nums"
                      >
                        {countdown}
                      </motion.div>
                    )}
                  </AnimatePresence>
                  {racing && !focused && (
                    <div className="absolute inset-0 flex cursor-pointer items-center justify-center gap-2 text-[14px] text-foreground">
                      <MousePointerClick className="size-4" /> Click here or press any key to focus
                    </div>
                  )}
                </div>

                <OnScreenKeyboard pressed={pressed} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <footer className="relative flex justify-center gap-6 font-mono text-[12px] text-muted-foreground">
          <AnimatePresence>
            {confirmEscape && (
              <motion.span
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="absolute -top-10 rounded-full bg-foreground px-3 py-1 text-background"
              >
                Press esc again to forfeit
              </motion.span>
            )}
          </AnimatePresence>
          <span className="flex items-center gap-2">
            <kbd className="rounded-md border bg-muted/60 px-1.5 py-0.5 text-foreground">esc</kbd>
            {racing ? 'forfeit' : 'leave'}
          </span>
        </footer>
      </div>

      {phase === 'voting' && <DuelVoteDialog match={match} onVote={vote} onLeave={leave} />}
      {/* The opponent left: the race stays frozen behind the news that the game is over. */}
      {phase === 'closed' && <DuelEndedDialog match={match} onClose={leave} />}
    </div>
  )
}
