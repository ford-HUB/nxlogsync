import type { CharStats } from '@/types/typing-test'

/** Characters per minute as words per minute (a "word" is five characters). */
export const toWpm = (chars: number, ms: number) => (ms > 0 ? (chars / 5) * (60_000 / ms) : 0)

/** Letter-by-letter comparison of what was typed against the target words. */
export function countChars(targets: string[], typed: string[]): CharStats {
  const stats: CharStats = { correct: 0, incorrect: 0, extra: 0, missed: 0 }
  typed.forEach((input, i) => {
    const target = targets[i] ?? ''
    for (let j = 0; j < Math.max(target.length, input.length); j++) {
      if (j >= target.length) stats.extra++
      else if (j >= input.length) stats.missed++
      else if (input[j] === target[j]) stats.correct++
      else stats.incorrect++
    }
  })
  return stats
}

/**
 * Characters that count toward net wpm: fully correct words plus the spaces after them. The
 * word still being typed counts for the letters typed so far when they are all correct.
 */
export function countCorrectWordChars(targets: string[], committed: string[], current: string) {
  let chars = 0
  committed.forEach((input, i) => {
    if (input === targets[i]) chars += input.length + 1
  })
  const target = targets[committed.length] ?? ''
  if (current.length > 0 && target.startsWith(current)) chars += current.length
  return chars
}

/** Pace evenness from per-second raw speed: 100 is perfectly steady (monkeytype's formula). */
export function consistency(samples: number[]) {
  if (samples.length < 2) return 100
  const mean = samples.reduce((a, b) => a + b, 0) / samples.length
  if (mean === 0) return 0
  const variance = samples.reduce((a, b) => a + (b - mean) ** 2, 0) / samples.length
  const cov = Math.sqrt(variance) / mean
  return Math.max(0, 100 * (1 - Math.tanh(cov + cov ** 3 / 3 + cov ** 5 / 5)))
}
