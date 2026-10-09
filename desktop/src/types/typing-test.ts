/** A timed test ends on the clock; a words test ends on its last word. */
export type TypingMode = 'time' | 'words'

export interface TypingConfig {
  mode: TypingMode
  /** Seconds for a time test, words for a words test. */
  amount: number
  punctuation: boolean
  numbers: boolean
}

export type TypingStatus = 'idle' | 'running' | 'finished'

/** One second of a test, for the results chart. */
export interface TypingSecond {
  second: number
  /** Net wpm so far (correct words only). */
  wpm: number
  /** Keystrokes in this second, as wpm. */
  raw: number
  /** Wrong keystrokes in this second. */
  errors: number
}

export interface CharStats {
  correct: number
  incorrect: number
  /** Typed past the end of a word. */
  extra: number
  /** Left untyped in a word that was skipped with space. */
  missed: number
}

export interface TypingResult {
  config: TypingConfig
  wpm: number
  raw: number
  /** Correct keystrokes out of all keystrokes, 0–100. */
  accuracy: number
  /** How even the pace was, 0–100. */
  consistency: number
  chars: CharStats
  seconds: number
  history: TypingSecond[]
  /** Beat the previous best for this exact config. */
  personalBest: boolean
}
