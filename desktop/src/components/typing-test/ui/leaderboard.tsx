import { ChevronUp, RotateCcw, Trophy, WifiOff } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { memo, useEffect, useMemo, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { boostIntensity } from '@/lib/typing-stats'
import { Skeleton } from '@/components/ui/skeleton'
import { LEADERBOARD_SIZE } from '@/constants/typing-test'
import type { LiveStatus } from '@/store/typing-leaderboard-store'
import type { LeaderboardEntry, TypingConfig } from '@/types/typing-test'
import { RocketBoost, SpeedLines } from './rocket-boost'

const YOU_ID = 'you'

interface LeaderboardProps {
  config: TypingConfig
  playerName: string
  /** The server's top players, the user's own row among them or not; undefined until loaded. */
  entries: LeaderboardEntry[] | undefined
  loading: boolean
  error: string | null
  onRetry: () => void
  /** Whether other players' new bests are arriving live. */
  live: LiveStatus
  /** The user's score to rank: their best, or the running test's wpm once it beats that. */
  wpm: number | undefined
  accuracy: number | undefined
}

const layoutSpring = { type: 'spring', stiffness: 380, damping: 32 } as const

interface RowProps {
  entry: LeaderboardEntry
  /** 1-based; undefined for the user when they have no score yet. */
  rank: number | undefined
  you?: boolean
  /** Climb intensity (boostIntensity) while the user's row is climbing; the rocket fires. */
  boost?: number
}

const Row = memo(function Row({ entry, rank, you = false, boost }: RowProps) {
  return (
    <motion.li
      layout="position"
      initial={you ? { opacity: 0, y: 12 } : false}
      animate={{
        opacity: 1,
        y: 0,
        boxShadow: boost ? `0 0 ${10 + 22 * boost}px -2px var(--score)` : '0 0 0px 0px var(--score)',
      }}
      transition={{
        layout: layoutSpring,
        opacity: { duration: 0.45 },
        y: { duration: 0.45 },
        boxShadow: { duration: 0.3 },
      }}
      data-you={you || undefined}
      className={cn(
        'relative grid grid-cols-[1.75rem_1fr_2.25rem_2.5rem] items-center gap-1 rounded-md px-2 py-1.5 text-[11px] tabular-nums min-[1440px]:grid-cols-[2.5rem_1fr_3.5rem_3.5rem] min-[1440px]:px-3 min-[1440px]:py-2 min-[1440px]:text-[13px]',
        you ? 'z-10 bg-foreground text-background' : 'text-foreground',
        boost && 'ring-1 ring-score',
      )}
    >
      <AnimatePresence>{boost && <RocketBoost intensity={boost} />}</AnimatePresence>
      <span
        className={cn(
          'text-right',
          !you && 'text-muted-foreground',
          rank !== undefined && rank <= 3 && !you && 'text-score',
        )}
      >
        {rank === undefined ? '—' : rank > LEADERBOARD_SIZE ? `${LEADERBOARD_SIZE}+` : rank}
      </span>
      <span className="truncate pl-1 min-[1440px]:pl-2">
        {entry.name}
        {you && <span className="ml-1.5 text-[9px] opacity-60 min-[1440px]:text-[10px]">you</span>}
      </span>
      <span className="text-right">{entry.wpm > 0 ? Math.round(entry.wpm) : '—'}</span>
      <span className={cn('text-right', !you && 'text-muted-foreground')}>
        {entry.accuracy > 0 ? `${Math.round(entry.accuracy)}%` : '—'}
      </span>
    </motion.li>
  )
})

const LIVE_LABELS: Record<LiveStatus, string> = {
  live: 'Other players’ new bests appear as they happen',
  connecting: 'Connecting for live updates…',
  offline: 'Live updates paused — the board refreshes when the server is back',
}

/** A small live / connecting / offline marker beside the title; Tetris's board shows it too. */
export function LiveBadge({ live }: { live: LiveStatus }) {
  return (
    <span
      title={LIVE_LABELS[live]}
      aria-label={LIVE_LABELS[live]}
      className="ml-1 flex items-center gap-1 text-[10px] font-normal tracking-[0.14em] text-muted-foreground uppercase"
    >
      {live === 'offline' ? (
        <WifiOff className="size-3" />
      ) : (
        <span className="relative flex size-1.5">
          {live === 'live' && (
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-score opacity-75" />
          )}
          <span
            className={cn(
              'relative inline-flex size-1.5 rounded-full',
              live === 'live' ? 'bg-score' : 'bg-muted-foreground',
            )}
          />
        </span>
      )}
      {live === 'connecting' ? 'connecting' : live}
    </span>
  )
}

/**
 * The top 100 for the current setup, with the user's row slotted in by score. Their row fades in
 * at the bottom, then climbs past each player live as the running test beats their score. The
 * user's own row from the server is left out and placed locally, so it can move mid-test.
 */
export function Leaderboard({
  config,
  playerName,
  entries,
  loading,
  error,
  onRetry,
  live,
  wpm,
  accuracy,
}: LeaderboardProps) {
  const others = useMemo(() => (entries ?? []).filter((e) => !e.you), [entries])
  const scored = wpm !== undefined && wpm > 0

  // Ties go to the player already on the board.
  const rank = scored ? others.filter((o) => o.wpm >= wpm).length + 1 : undefined
  const onBoard = rank !== undefined && rank <= LEADERBOARD_SIZE

  const you: LeaderboardEntry = {
    id: YOU_ID,
    name: playerName || 'you',
    wpm: wpm ?? 0,
    accuracy: accuracy ?? 0,
    you: true,
  }
  const rows = onBoard
    ? [...others.slice(0, rank - 1), you, ...others.slice(rank - 1, LEADERBOARD_SIZE - 1)]
    : [...others.slice(0, LEADERBOARD_SIZE), you]

  // A short "climbed" badge each time the rank improves.
  const [climb, setClimb] = useState<{ by: number; at: number } | null>(null)
  const lastRankRef = useRef(rank)
  useEffect(() => {
    const prev = lastRankRef.current
    lastRankRef.current = rank
    if (rank === undefined) return
    const from = prev ?? LEADERBOARD_SIZE + 1
    if (rank < from)
      setClimb({
        by: Math.min(from, LEADERBOARD_SIZE + 1) - rank,
        at: Date.now(),
      })
  }, [rank])
  useEffect(() => {
    if (!climb) return
    const id = window.setTimeout(() => setClimb(null), 1800)
    return () => window.clearTimeout(id)
  }, [climb])

  // While climbing, the rocket and speed lines run harder the faster the user types.
  const boost = climb && wpm ? boostIntensity(wpm) : undefined

  // Keep the user's row in view as it climbs.
  const listRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const list = listRef.current
    const row = list?.querySelector<HTMLElement>('[data-you]')
    if (!list || !row) return
    const top = row.offsetTop - list.clientHeight / 2 + row.offsetHeight / 2
    list.scrollTo({ top, behavior: 'smooth' })
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
          <Trophy className="size-4 text-score" /> Top {LEADERBOARD_SIZE}
          <LiveBadge live={live} />
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
          {config.mode} {config.amount}
        </span>
      </header>

      <div className="grid grid-cols-[1.75rem_1fr_2.25rem_2.5rem] gap-1 px-3 pt-2 pb-1 text-[9px] min-[1440px]:grid-cols-[2.5rem_1fr_3.5rem_3.5rem] min-[1440px]:px-7 min-[1440px]:text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
        <span className="text-right">#</span>
        <span className="pl-1 min-[1440px]:pl-2">name</span>
        <span className="text-right">wpm</span>
        <span className="text-right">acc</span>
      </div>

      {/* No frame: the list just fades out at its top and bottom edges. */}
      <div className="relative min-h-0 flex-1 [mask-image:linear-gradient(to_bottom,transparent,black_2rem,black_calc(100%-4rem),transparent)] min-[1440px]:[mask-image:linear-gradient(to_bottom,transparent,black_3rem,black_calc(100%-6rem),transparent)]">
        <AnimatePresence>{boost && <SpeedLines intensity={boost} />}</AnimatePresence>
        <div
          ref={listRef}
          className="relative h-full overflow-y-auto px-1 py-10 min-[1440px]:px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {/* One flat list, so the user's row keeps its key (and animates) moving onto the board. */}
          {!entries && loading && (
            <div aria-label="Loading leaderboard" className="flex flex-col gap-3 px-3 py-2">
              {Array.from({ length: 10 }, (_, i) => (
                <Skeleton key={i} className="h-5" style={{ opacity: 1 - i * 0.08 }} />
              ))}
            </div>
          )}
          {error && !loading && (
            <div className="flex flex-col items-center gap-2 px-3 py-6 text-center text-[12px] text-muted-foreground">
              Couldn&apos;t load the leaderboard.
              <span className="text-[11px]">{error}</span>
              <button
                type="button"
                onClick={onRetry}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-foreground hover:bg-muted"
              >
                <RotateCcw className="size-3" /> Retry
              </button>
            </div>
          )}
          <ol className="flex flex-col">
            {rows.map((entry, i) =>
              entry.id === YOU_ID ? (
                <Row key={YOU_ID} entry={entry} rank={rank} you boost={boost} />
              ) : (
                <Row key={entry.id} entry={entry} rank={i + 1} />
              ),
            )}
          </ol>
        </div>
      </div>
    </motion.aside>
  )
}
