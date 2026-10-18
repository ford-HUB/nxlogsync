import { Swords } from 'lucide-react'
import { motion } from 'motion/react'
import { DUEL_RACES } from '@/constants/typing-duel'
import { cn } from '@/lib/utils'
import type { LiveStatus } from '@/store/typing-leaderboard-store'
import type { DuelMatch } from '@/types/typing-duel'
import { LiveBadge } from './leaderboard'

interface ScoreRow {
  name: string
  points: number
  /** Live while racing, the result after. */
  wpm: number
  /** Known once the race is over. */
  accuracy: number | null
  /** 0–1 of the words, or of the leader's count in a timed race. */
  at: number
}

interface DuelScoreboardProps {
  match: DuelMatch
  you: ScoreRow
  opponent: ScoreRow
  live: LiveStatus
}

const COLS = 'grid-cols-[1fr_2.25rem_2.5rem_2.5rem] min-[1440px]:grid-cols-[1fr_3rem_3.5rem_3.5rem]'

function Row({ row, you }: { row: ScoreRow; you: boolean }) {
  return (
    <li
      className={cn(
        'relative grid items-center gap-1 overflow-hidden rounded-md px-2 py-2 text-[11px] tabular-nums min-[1440px]:px-3 min-[1440px]:py-2.5 min-[1440px]:text-[13px]',
        COLS,
        you ? 'bg-foreground text-background' : 'text-foreground ring-1 ring-score/40',
      )}
    >
      {/* How far along, as a wash behind the row. */}
      <motion.span
        aria-hidden
        className={cn('absolute inset-y-0 left-0', you ? 'bg-background/10' : 'bg-score/10')}
        initial={false}
        animate={{ width: `${row.at * 100}%` }}
        transition={{ type: 'spring', stiffness: 220, damping: 30 }}
      />
      <span className="relative truncate">
        {row.name}
        {you && <span className="ml-1.5 text-[9px] opacity-60 min-[1440px]:text-[10px]">you</span>}
      </span>
      <span className={cn('relative text-right font-semibold', !you && 'text-score')}>{row.points}</span>
      <span className="relative text-right">{row.wpm > 0 ? Math.round(row.wpm) : '—'}</span>
      <span className={cn('relative text-right', !you && 'text-muted-foreground')}>
        {row.accuracy !== null ? `${Math.round(row.accuracy)}%` : '—'}
      </span>
    </li>
  )
}

/** In place of the leaderboard during a 1v1: the points so far, and both racers' pace live. */
export function DuelScoreboard({ match, you, opponent, live }: DuelScoreboardProps) {
  const race = DUEL_RACES.find((r) => r.option === match.option)
  return (
    <motion.aside
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      aria-label="1v1 score"
      className="flex w-full flex-col font-mono"
    >
      <header className="flex items-center justify-between gap-2 px-3 pb-2 min-[1440px]:px-7">
        <span className="flex items-center gap-1.5 text-[12px] font-medium text-foreground min-[1440px]:text-[13px]">
          <Swords className="size-4 text-score" /> 1v1
          <LiveBadge live={live} />
        </span>
        <span className="text-[11px] text-muted-foreground">round {match.round}</span>
      </header>

      {/* The points, big: the score of the 1v1 so far. */}
      <div className="flex items-baseline justify-center gap-3 py-6 tabular-nums">
        <span className="text-4xl font-semibold text-foreground min-[1440px]:text-5xl">{you.points}</span>
        <span className="text-lg text-muted-foreground">:</span>
        <span className="text-4xl font-semibold text-score min-[1440px]:text-5xl">{opponent.points}</span>
      </div>

      <div
        className={cn(
          'grid gap-1 px-3 pt-2 pb-1 text-[9px] tracking-[0.14em] text-muted-foreground uppercase min-[1440px]:px-7 min-[1440px]:text-[10px]',
          COLS,
        )}
      >
        <span>name</span>
        <span className="text-right">pts</span>
        <span className="text-right">wpm</span>
        <span className="text-right">acc</span>
      </div>
      <ol className="flex flex-col gap-1.5 px-1 min-[1440px]:px-4">
        <Row row={you} you />
        <Row row={opponent} you={false} />
      </ol>

      {race && match.config && (
        <p className="px-3 pt-4 text-[11px] leading-relaxed text-muted-foreground min-[1440px]:px-7">
          {race.mode === 'words'
            ? `${race.label.toLowerCase()} · ${race.detail} in ${match.config.limit}s · first to finish wins, else most correct letters`
            : `speed · ${match.config.limit}s · most correct letters wins`}
        </p>
      )}
    </motion.aside>
  )
}
