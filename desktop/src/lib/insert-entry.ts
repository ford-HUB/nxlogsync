import { finishForWork, workMinutes } from '@/constants/daily-log'
import type { LogEntry } from '@/types/daily-log'

/** New times for an entry pushed later to make room. */
export interface EntryMove {
  id: string
  startMinutes: number
  endMinutes: number
}

/** Where an inserted entry lands, and the entries below it that move to make room. */
export interface InsertPlan {
  startMinutes: number
  endMinutes: number
  moves: EntryMove[]
}

type Range = Pick<LogEntry, 'startMinutes' | 'endMinutes'>

/** The finish that keeps `duration` of work from `start`, or null when it would run past midnight. */
function fitEnd(start: number, duration: number): number | null {
  const end = finishForWork(start, duration)
  return workMinutes(start, end) === duration ? end : null
}

/**
 * Slots `entry` in at `index` of a day's start-ordered entries. It starts where the entry above it
 * finishes (the first entry's start at the top, its own time on an empty day) and keeps its work
 * duration. Entries below that it now overlaps are pushed later one after another, each keeping its
 * own work duration; the push stops at the first gap wide enough to take it. Null when anything
 * would run past midnight.
 */
export function planInsert(entries: LogEntry[], entry: Range, index: number): InsertPlan | null {
  const start =
    index > 0 ? entries[index - 1].endMinutes : entries.length > 0 ? entries[0].startMinutes : entry.startMinutes
  const end = fitEnd(start, workMinutes(entry.startMinutes, entry.endMinutes))
  if (end === null) return null

  const moves: EntryMove[] = []
  let cursor = end
  for (const below of entries.slice(index)) {
    if (below.startMinutes >= cursor) break
    const movedEnd = fitEnd(cursor, workMinutes(below.startMinutes, below.endMinutes))
    if (movedEnd === null) return null
    moves.push({ id: below.id, startMinutes: cursor, endMinutes: movedEnd })
    cursor = movedEnd
  }
  return { startMinutes: start, endMinutes: end, moves }
}
