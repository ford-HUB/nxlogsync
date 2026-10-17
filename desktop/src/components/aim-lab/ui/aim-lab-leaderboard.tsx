import { RotateCcw, Trophy } from 'lucide-react'
import { motion } from 'motion/react'
import { memo, useEffect, useMemo, useRef } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { AIM_LAB_LEADERBOARD_SIZE } from '@/constants/aim-lab'
import { cn } from '@/lib/utils'
import type { AimLabLeaderboardEntry } from '@/types/aim-lab'

const YOU_ID = 'you'

interface AimLabLeaderboardProps {
  /** The round length whose board this is. */
  seconds: number
  playerName: string
  /** The server's top players, the user's own row among them or not; undefined until loaded. */
  entries: AimLabLeaderboardEntry[] | undefined
  loading: boolean
  error: string | null
  onRetry: () => void
  /** No connected account: the board can't be read, and rounds aren't saved to it. */
  signedOut: boolean
  /** The user's best round for this length, slotted in among the players by hits. */
  best: { score: number; accuracy: number } | undefined
}

const layoutSpring = { type: 'spring', stiffness: 380, damping: 32 } as const

interface RowProps {
  entry: AimLabLeaderboardEntry
  /** 1-based; undefined for the user when they have no round yet. */
  rank: number | undefined
  you?: boolean
}

const Row = memo(function Row({ entry, rank, you = false }: RowProps) {
  return (
    <motion.li
      layout="position"
      initial={you ? { opacity: 0, y: 12 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ layout: layoutSpring, opacity: { duration: 0.45 }, y: { duration: 0.45 } }}
      data-you={you || undefined}
      className={cn(
        'relative grid items-center gap-1 rounded-md tabular-nums grid-cols-[2.5rem_1fr_3.5rem_4rem] px-3 py-2 text-[13px]',
        you ? 'z-10 bg-foreground text-background' : 'text-foreground',
      )}
    >
      <span className={cn('text-right', !you && 'text-muted-foreground', rank !== undefined && rank <= 3 && !you && 'text-score')}>
        {rank === undefined ? '—' : rank > AIM_LAB_LEADERBOARD_SIZE ? `${AIM_LAB_LEADERBOARD_SIZE}+` : rank}
      </span>
      <span className="truncate pl-2">
        {entry.name}
        {you && <span className="ml-1.5 text-[10px] opacity-60">you</span>}
      </span>
      <span className="text-right">{entry.score > 0 ? entry.score : '—'}</span>
      <span className={cn('text-right', !you && 'text-muted-foreground')}>
        {entry.score > 0 ? `${entry.accuracy.toFixed(1)}%` : '—'}
      </span>
    </motion.li>
  )
})

/**
 * The top players for one round length, ranked by hits, with the user's best slotted in, laid out
 * like Tetris's board. The players come from the server; each length has its own board.
 */
export function AimLabLeaderboard({ seconds, playerName, entries, loading, error, onRetry, signedOut, best }: AimLabLeaderboardProps) {
  const others = useMemo(() => (entries ?? []).filter((e) => !e.you), [entries])
  const scored = best !== undefined && best.score > 0

  // Ties go to the player already on the board.
  const rank = scored ? others.filter((o) => o.score >= best.score).length + 1 : undefined
  const onBoard = rank !== undefined && rank <= AIM_LAB_LEADERBOARD_SIZE

  const you: AimLabLeaderboardEntry = {
    id: YOU_ID,
    name: playerName || 'you',
    score: best?.score ?? 0,
    accuracy: best?.accuracy ?? 0,
    you: true,
  }
  const rows = onBoard
    ? [...others.slice(0, rank - 1), you, ...others.slice(rank - 1, AIM_LAB_LEADERBOARD_SIZE - 1)]
    : [...others.slice(0, AIM_LAB_LEADERBOARD_SIZE), you]

  // Keep the user's row in view.
  const listRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const list = listRef.current
    const row = list?.querySelector<HTMLElement>('[data-you]')
    if (!list || !row) return
    list.scrollTo({ top: row.offsetTop - list.clientHeight / 2 + row.offsetHeight / 2, behavior: 'smooth' })
  }, [rank, onBoard, entries])

  return (
    <motion.aside
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      aria-label="Leaderboard"
      className="relative flex h-full w-full flex-col font-mono"
    >
      <header className="flex items-center justify-between gap-2 px-7 pb-2">
        <span className="flex items-center gap-1.5 text-[13px] font-medium text-foreground">
          <Trophy className="size-4 text-score" /> Top {AIM_LAB_LEADERBOARD_SIZE}
        </span>
        <span className="text-[11px] text-muted-foreground">{seconds}s</span>
      </header>

      <div className="grid gap-1 px-7 pt-2 pb-1 tracking-[0.14em] text-muted-foreground uppercase grid-cols-[2.5rem_1fr_3.5rem_4rem] text-[10px]">
        <span className="text-right">#</span>
        <span className="pl-2">name</span>
        <span className="text-right">hits</span>
        <span className="text-right">acc</span>
      </div>

      {/* No frame: the list just fades out at its top and bottom edges. */}
      <div className="relative min-h-0 flex-1 [mask-image:linear-gradient(to_bottom,transparent,black_3rem,black_calc(100%-6rem),transparent)]">
        <div
          ref={listRef}
          className="relative h-full overflow-y-auto px-4 py-10 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {signedOut && (
            <p className="px-3 py-6 text-center text-[12px] text-muted-foreground">
              Connect your account in Settings to join the leaderboard. Until then your rounds are only kept until you
              close the app.
            </p>
          )}
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
                onMouseDown={(e) => e.preventDefault()}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-foreground hover:bg-muted"
              >
                <RotateCcw className="size-3" /> Retry
              </button>
            </div>
          )}
          {/* One flat list, so the user's row keeps its key (and animates) moving onto the board. */}
          <ol className="flex flex-col">
            {rows.map((entry, i) =>
              entry.id === YOU_ID ? (
                <Row key={YOU_ID} entry={entry} rank={rank} you />
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
