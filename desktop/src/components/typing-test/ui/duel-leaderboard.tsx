import { RotateCcw, Swords, Trophy } from 'lucide-react'
import { motion } from 'motion/react'
import { useEffect, useRef } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { LEADERBOARD_SIZE } from '@/constants/typing-test'
import { cn } from '@/lib/utils'
import type { LiveStatus } from '@/store/typing-leaderboard-store'
import type { DuelLeaderboard } from '@/types/typing-duel'
import { LiveBadge } from './leaderboard'

interface DuelLeaderboardProps {
  /** Null until loaded. */
  board: DuelLeaderboard | null
  loading: boolean
  error: string | null
  onRetry: () => void
  live: LiveStatus
  /** The user's leaderboard name, for their row before they have a record. */
  playerName: string
}

const COLS = 'grid-cols-[1.75rem_1fr_2.25rem_2.5rem] min-[1440px]:grid-cols-[2.5rem_1fr_3.5rem_3.5rem]'

interface RowProps {
  rank: number | undefined
  name: string
  points: number | undefined
  wins: number | undefined
  losses: number | undefined
  you?: boolean
}

function Row({ rank, name, points, wins, losses, you = false }: RowProps) {
  return (
    <motion.li
      layout="position"
      initial={{ opacity: 0, y: you ? 12 : 0 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      data-you={you || undefined}
      className={cn(
        'relative grid items-center gap-1 rounded-md px-2 py-1.5 text-[11px] tabular-nums min-[1440px]:px-3 min-[1440px]:py-2 min-[1440px]:text-[13px]',
        COLS,
        you ? 'z-10 bg-foreground text-background' : 'text-foreground',
      )}
    >
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
        {name}
        {you && <span className="ml-1.5 text-[9px] opacity-60 min-[1440px]:text-[10px]">you</span>}
      </span>
      <span className="text-right font-semibold">{points ?? '—'}</span>
      <span className={cn('text-right', !you && 'text-muted-foreground')}>
        {wins !== undefined && losses !== undefined ? `${wins}-${losses}` : '—'}
      </span>
    </motion.li>
  )
}

/**
 * The 1v1 top 100, laid out like the solo leaderboard: most races won first (a point each, as in
 * a match's score), with wins–losses beside. The user's row is always there, highlighted: on the
 * board at their rank, or under it with their rank or a dash before their first decided race.
 */
export function DuelLeaderboard({ board, loading, error, onRetry, live, playerName }: DuelLeaderboardProps) {
  const entries = board?.entries ?? []
  const you = board?.you ?? null
  const onBoard = entries.some((e) => e.you)

  // Keep the user's row in view.
  const listRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const list = listRef.current
    const row = list?.querySelector<HTMLElement>('[data-you]')
    if (!list || !row) return
    list.scrollTo({ top: row.offsetTop - list.clientHeight / 2 + row.offsetHeight / 2, behavior: 'smooth' })
  }, [board])

  return (
    <motion.aside
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      aria-label="1v1 leaderboard"
      className="flex h-full w-full flex-col font-mono"
    >
      <header className="flex items-center justify-between gap-2 px-3 pb-2 min-[1440px]:px-7">
        <span className="flex items-center gap-1.5 text-[12px] font-medium text-foreground min-[1440px]:text-[13px]">
          <Trophy className="size-4 text-score" /> Top {LEADERBOARD_SIZE}
          <LiveBadge live={live} />
        </span>
        <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Swords className="size-3" /> 1v1 wins
        </span>
      </header>

      <div
        className={cn(
          'grid gap-1 px-3 pt-2 pb-1 text-[9px] tracking-[0.14em] text-muted-foreground uppercase min-[1440px]:px-7 min-[1440px]:text-[10px]',
          COLS,
        )}
      >
        <span className="text-right">#</span>
        <span className="pl-1 min-[1440px]:pl-2">name</span>
        <span className="text-right">pts</span>
        <span className="text-right">w-l</span>
      </div>

      {/* No frame: the list just fades out at its top and bottom edges, like the solo board. */}
      <div className="relative min-h-0 flex-1 [mask-image:linear-gradient(to_bottom,transparent,black_2rem,black_calc(100%-4rem),transparent)] min-[1440px]:[mask-image:linear-gradient(to_bottom,transparent,black_3rem,black_calc(100%-6rem),transparent)]">
        <div
          ref={listRef}
          className="relative h-full overflow-y-auto px-1 py-10 min-[1440px]:px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {!board && loading && (
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
          {board && entries.length === 0 && (
            <p className="px-3 pb-4 text-center text-[11px] text-muted-foreground">No 1v1 wins yet. Win a race to get on the board.</p>
          )}
          {(board || !loading) && (
            <ol className="flex flex-col">
              {entries.map((entry, i) => (
                <Row
                  key={entry.id}
                  rank={i + 1}
                  name={entry.name}
                  points={entry.points}
                  wins={entry.wins}
                  losses={entry.losses}
                  you={entry.you}
                />
              ))}
              {!onBoard && (
                <Row
                  key="you"
                  rank={you?.rank}
                  name={playerName || 'you'}
                  points={you?.points}
                  wins={you?.wins}
                  losses={you?.losses}
                  you
                />
              )}
            </ol>
          )}
        </div>
      </div>
    </motion.aside>
  )
}
