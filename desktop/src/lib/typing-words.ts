import { ENGLISH_200, PUNCTUATION_ENDINGS } from '@/constants/typing-test'
import type { TypingConfig } from '@/types/typing-test'

const pick = <T,>(list: readonly T[]) => list[Math.floor(Math.random() * list.length)]
const capitalize = (word: string) => word.charAt(0).toUpperCase() + word.slice(1)

/**
 * Random words for a test, never the same word twice in a row. Punctuation capitalises the
 * start of each sentence and ends words with a mark now and then; numbers swap in a short
 * number for roughly one word in ten. Local mock until the words API is connected.
 */
export function generateWords(count: number, config: Pick<TypingConfig, 'punctuation' | 'numbers'>, previous?: string) {
  const words: string[] = []
  let last = previous
  let sentenceStart = !previous || /[.?!]$/.test(previous)
  while (words.length < count) {
    let word = pick(ENGLISH_200)
    if (word === last?.replace(/[^a-z]/gi, '').toLowerCase()) continue
    if (config.numbers && Math.random() < 0.1) word = String(Math.floor(Math.random() * 10_000))
    if (config.punctuation) {
      if (sentenceStart) word = capitalize(word)
      sentenceStart = false
      if (Math.random() < 0.15) {
        const mark = pick(PUNCTUATION_ENDINGS)
        word += mark
        sentenceStart = mark === '.' || mark === '?' || mark === '!'
      }
    }
    words.push(word)
    last = word
  }
  return words
}
