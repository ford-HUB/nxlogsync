import { ChevronUp, Trophy } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { memo, useEffect, useRef, useState } from 'react'
import { RocketBoost, SpeedLines } from '@/components/typing-test/ui/rocket-boost'
import { RUN_LEADERBOARD_SIZE } from '@/constants/run-yourself'
import { cn } from '@/lib/utils'
import type { RunLeaderboardEntry } from '@/types/run-yourself'

const YOU_ID = 'you'
const CLIMB_BADGE_MS = 1800
const layoutSpring = { type: 'spring', stiffness: 380, damping: 32 } as const

interface RunLeaderboardProps {
  /** e.g. "speed run 60s" or "pass or fall". */
  label: string
  /** The leaderboard name picked for the typing test, shared by every game; "you" without one. */
  playerName: string
  /** Sample players, not a real board yet: marked as a preview. */
  preview?: boolean
  /** Other players, best first, from the server. */
  entries: RunLeaderboardEntry[]
  /** The user's score to rank: their best, or the running game's points once they beat it. */
  points: number | undefined
  metres: number | undefined
  seconds: number | undefined
  /** False when the user's run was knocked out short of the line: their row shows its distance. */
  finished?: boolean
  /** A speed run's last column is the finish time (everyone runs the same distance); otherwise distance. */
  column: 'time' | 'dist'
  /** How hard the rocket fires while climbing (runBoost of the current speed). */
  boost: number
}

interface RowProps {
  entry: RunLeaderboardEntry
  column: 'time' | 'dist'
  rank: number | undefined
  you?: boolean
  boost?: number
}

const Row = memo(function Row({ entry, column, rank, you = false, boost }: RowProps) {
  return (
    <motion.li
      layout="position"
      initial={you ? { opacity: 0, y: 12 } : false}
      animate={{
        opacity: 1,
        y: 0,
        boxShadow: boost ? `0 0 ${10 + 22 * boost}px -2px var(--score)` : '0 0 0px 0px var(--score)',
      }}
      transition={{ layout: layoutSpring, opacity: { duration: 0.45 }, y: { duration: 0.45 }, boxShadow: { duration: 0.3 } }}
      data-you={you || undefined}
      className={cn(
        'relative grid grid-cols-[1.75rem_1fr_3.5rem_2.75rem] items-center gap-1 rounded-md px-2 py-1.5 text-[11px] tabular-nums min-[1440px]:grid-cols-[2.5rem_1fr_4.5rem_3.5rem] min-[1440px]:px-3 min-[1440px]:py-2 min-[1440px]:text-[13px]',
        you ? 'z-10 bg-foreground text-background' : 'text-foreground',
        boost && 'ring-1 ring-score',
      )}
    >
      <AnimatePresence>{boost && <RocketBoost intensity={boost} />}</AnimatePresence>
      <span className={cn('text-right', !you && 'text-muted-foreground', rank !== undefined && rank <= 3 && !you && 'text-score')}>
        {rank === undefined ? '—' : rank > RUN_LEADERBOARD_SIZE ? `${RUN_LEADERBOARD_SIZE}+` : rank}
      </span>
      <span className="truncate pl-1 min-[1440px]:pl-2">
        {entry.name}
        {you && <span className="ml-1.5 text-[9px] opacity-60 min-[1440px]:text-[10px]">you</span>}
      </span>
      <span className="text-right">{entry.points > 0 ? entry.points.toLocaleString() : '—'}</span>
      <span className={cn('text-right', !you && 'text-muted-foreground')}>
        {column === 'time' && entry.finished !== false
          ? entry.seconds > 0
            ? `${entry.seconds.toFixed(1)}s`
            : '—'
          : entry.metres > 0
            ? `${entry.metres}m`
            : '—'}
      </span>
    </motion.li>
  )
})

/**
 * The top players for the current game, with the user's row slotted in by points. Mid-run their
 * row climbs past each player it beats, a rocket under it and speed lines down the board, both
 * firing harder the faster the run is going.
 */
export function RunLeaderboard({ label, playerName, preview = false, entries, points, metres, seconds, finished, column, boost }: RunLeaderboardProps) {
  const scored = points !== undefined && points > 0
  // Ties go to the player already on the board.
  const rank = scored ? entries.filter((o) => o.points >= points).length + 1 : undefined
  const onBoard = rank !== undefined && rank <= RUN_LEADERBOARD_SIZE
  const you: RunLeaderboardEntry = {
    id: YOU_ID,
    name: playerName || 'you',
    points: points ?? 0,
    metres: metres ?? 0,
    seconds: seconds ?? 0,
    finished,
    you: true,
  }
  const rows = onBoard
    ? [...entries.slice(0, rank - 1), you, ...entries.slice(rank - 1, RUN_LEADERBOARD_SIZE - 1)]
    : [...entries.slice(0, RUN_LEADERBOARD_SIZE), you]

  // A short "climbed" badge each time the rank improves; the rocket fires while it shows.
  const [climb, setClimb] = useState<{ by: number; at: number } | null>(null)
  const lastRankRef = useRef(rank)
  useEffect(() => {
    const prev = lastRankRef.current
    lastRankRef.current = rank
    if (rank === undefined) return
    const from = Math.min(prev ?? RUN_LEADERBOARD_SIZE + 1, RUN_LEADERBOARD_SIZE + 1)
    if (rank < from) setClimb({ by: from - rank, at: Date.now() })
  }, [rank])
  useEffect(() => {
    if (!climb) return
    const id = window.setTimeout(() => setClimb(null), CLIMB_BADGE_MS)
    return () => window.clearTimeout(id)
  }, [climb])
  const climbing = climb ? boost : undefined

  // Keep the user's row in view as it climbs.
  const listRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const list = listRef.current
    const row = list?.querySelector<HTMLElement>('[data-you]')
    if (!list || !row) return
    list.scrollTo({ top: row.offsetTop - list.clientHeight / 2 + row.offsetHeight / 2, behavior: 'smooth' })
  }, [rank, onBoard])

  return (
    <motion.aside
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      aria-label="Leaderboard"
      className="flex h-full w-full flex-col font-mono"
    >
      <header className="flex items-center justify-between gap-2 px-3 pb-2 min-[1440px]:px-7">
        <span className="flex items-center gap-1.5 text-[12px] font-medium text-foreground min-[1440px]:text-[13px]">
          <Trophy className="size-4 text-score" /> Top {RUN_LEADERBOARD_SIZE}
          {preview && (
            <span
              title="Sample players for now: there is no board for this game on the server yet"
              className="ml-1 rounded-full border px-1.5 text-[9px] font-normal tracking-[0.14em] text-muted-foreground uppercase"
            >
              preview
            </span>
          )}
        </span>
        <span className="relative flex items-center gap-2 text-[11px] text-muted-foreground">
          <AnimatePresence>
            {climb && (
              <motion.span
                key={climb.at}
                initial={{ opacity: 0, y: 6, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6 }}
                className="flex items-center gap-0.5 rounded-full bg-score/15 px-1.5 py-0.5 text-[10px] font-semibold text-score"
              >
                <ChevronUp className="size-3" />
                {climb.by}
              </motion.span>
            )}
          </AnimatePresence>
          {label}
        </span>
      </header>

      <div className="grid grid-cols-[1.75rem_1fr_3.5rem_2.75rem] gap-1 px-3 pt-2 pb-1 text-[9px] tracking-[0.14em] text-muted-foreground uppercase min-[1440px]:grid-cols-[2.5rem_1fr_4.5rem_3.5rem] min-[1440px]:px-7 min-[1440px]:text-[10px]">
        <span className="text-right">#</span>
        <span className="pl-1 min-[1440px]:pl-2">name</span>
        <span className="text-right">pts</span>
        <span className="text-right">{column}</span>
      </div>

      <div className="relative min-h-0 flex-1 [mask-image:linear-gradient(to_bottom,transparent,black_2rem,black_calc(100%-4rem),transparent)] min-[1440px]:[mask-image:linear-gradient(to_bottom,transparent,black_3rem,black_calc(100%-6rem),transparent)]">
        <AnimatePresence>{climbing && <SpeedLines key={climbing} intensity={climbing} />}</AnimatePresence>
        <div ref={listRef} className="relative h-full overflow-y-auto px-1 py-10 [scrollbar-width:none] min-[1440px]:px-4 [&::-webkit-scrollbar]:hidden">
          <ol className="flex flex-col">
            {rows.map((entry, i) =>
              entry.id === YOU_ID ? (
                <Row key={YOU_ID} entry={entry} column={column} rank={rank} you boost={climbing} />
              ) : (
                <Row key={entry.id} entry={entry} column={column} rank={i + 1} />
              ),
            )}
          </ol>
        </div>
      </div>
    </motion.aside>
  )
}
