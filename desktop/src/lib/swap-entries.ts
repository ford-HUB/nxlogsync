import { finishForWork, workMinutes } from '@/constants/daily-log'
import type { LogEntry } from '@/types/daily-log'
import type { EntryMove } from './insert-entry'

/**
 * Trades the places of two of a day's start-ordered entries. The tasks from the earlier one to the
 * later one are laid out again from the earlier one's start in the new order: each keeps its own
 * work duration, and the gaps between the slots stay where they were. Resolves to the entries whose
 * times change; empty when nothing moves, null when anything would run past midnight.
 */
export function planSwap(entries: LogEntry[], fromId: string, toId: string): EntryMove[] | null {
  const from = entries.findIndex((e) => e.id === fromId)
  const to = entries.findIndex((e) => e.id === toId)
  if (from < 0 || to < 0 || from === to) return []
  const lo = Math.min(from, to)
  const hi = Math.max(from, to)
  const slots = entries.slice(lo, hi + 1)
  const order = [...slots]
  ;[order[0], order[order.length - 1]] = [order[order.length - 1], order[0]]

  const moves: EntryMove[] = []
  let cursor = slots[0].startMinutes
  for (const [i, entry] of order.entries()) {
    // The gap that followed this slot, in work time, so lunch isn't counted as a gap twice.
    const startMinutes = i === 0 ? cursor : finishForWork(cursor, workMinutes(slots[i - 1].endMinutes, slots[i].startMinutes))
    const duration = workMinutes(entry.startMinutes, entry.endMinutes)
    const endMinutes = finishForWork(startMinutes, duration)
    if (workMinutes(startMinutes, endMinutes) !== duration) return null
    if (startMinutes !== entry.startMinutes || endMinutes !== entry.endMinutes) {
      moves.push({ id: entry.id, startMinutes, endMinutes })
    }
    cursor = endMinutes
  }
  // Durations and gaps are kept, so the block can't outgrow its old span; guard the next task anyway.
  const next = entries[hi + 1]
  if (next && cursor > next.startMinutes) return null
  return moves
}
