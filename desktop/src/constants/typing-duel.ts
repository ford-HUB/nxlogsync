import type { DuelDuration, DuelOption } from '@/types/typing-duel'
import type { TypingMode } from '@/types/typing-test'

export interface DuelRace {
  option: DuelOption
  label: string
  /** What it plays, e.g. "10 words". */
  detail: string
  mode: TypingMode
}

/** The races to vote on (the server's DUEL_WORDS; Speed lasts the voted time). */
export const DUEL_RACES: readonly DuelRace[] = [
  { option: 'short', label: 'Short', detail: '10 words', mode: 'words' },
  { option: 'medium', label: 'Medium', detail: '25 words', mode: 'words' },
  { option: 'long', label: 'Long', detail: '50 words', mode: 'words' },
  { option: 'speed', label: 'Speed', detail: 'most words in the time', mode: 'time' },
]

/** The times to vote on (the server's DUEL_DURATIONS), in seconds. */
export const DUEL_DURATIONS: readonly DuelDuration[] = [15, 30, 60, 120]

/** How often the user's caret is sent to the opponent while racing. */
export const DUEL_PROGRESS_INTERVAL_MS = 120

/** How long a "declined" or "expired" stays on the lobby row before it can be sent again. */
export const DUEL_INVITE_RESULT_SHOWN_MS = 4000
/** How long a failed accept's notice stays up. */
export const DUEL_NOTICE_SHOWN_MS = 4000
/** A second Escape within this forfeits the race. */
export const DUEL_ESCAPE_CONFIRM_MS = 2000
