import type { TypingConfig } from '@/types/typing-test'

export const TIME_AMOUNTS = [15, 30, 60, 120] as const
export const WORD_AMOUNTS = [10, 25, 50, 100] as const

export const DEFAULT_TYPING_CONFIG: TypingConfig = { mode: 'time', amount: 30, punctuation: false, numbers: false }

/** Words generated ahead of the caret in a time test; more are appended as it runs low. */
export const TIME_TEST_BUFFER = 60
/** Extra letters accepted past a word's end before further typing is ignored. */
export const MAX_EXTRA_LETTERS = 10
/** Visible lines of words; the caret stays on the middle one once the test is under way. */
export const VISIBLE_LINES = 3

/**
 * MOCK word source: the 200 most common English words (monkeytype's "english" list).
 * Stand-in for the words API until it is wired up; swap generateWords' source when it is.
 */
export const ENGLISH_200 = `the be of and a to in he have it that for they with as not on she at by this we you do but from or which one would all will there say who make when can more if no man out other so what time up go about than into could state only new year some take come these know see use get like then first any work now may such give over think most even find day also after way many must look before great back through long where much should well people down own just because good each those feel seem how high too place little world very still nation hand old life tell write become here show house both between need mean call develop under last right move thing general school never same another begin while number part turn real leave might want point form off child few small since against ask late home interest large person end open public follow during present without again hold govern around possible head consider word program problem however lead system set order eye plan run keep face fact group play stand increase early course change help line`.split(' ')

export const PUNCTUATION_ENDINGS = ['.', ',', '?', '!', ';', ':'] as const
