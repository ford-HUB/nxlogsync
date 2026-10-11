import {
  OVERVIEW_FILLER_WORDS,
  OVERVIEW_PHRASES,
  OVERVIEW_SAME_ITEM_OVERLAP,
  OVERVIEW_WORD_LIMIT,
} from '@/constants/excel-report'
import type { OverviewItem, ReportKind } from '@/types/excel-report'

/** Words, not counting separators such as "-", "/" or "&". */
const words = (text: string) => text.split(' ').filter((w) => /\w/.test(w))

/** Clauses are joined by " - " or " / " in the remarks. */
const CLAUSE_SPLIT = /\s+[-/]\s+/

/**
 * Removes what the report already says or that adds no meaning: the report's own name (every FEM
 * line saying "FEM"), meeting dates like 20260807 or 2026/08/07, and a trailing "- FEM REQUEST".
 * "*" bullet lists become " / "-separated clauses.
 */
function strip(text: string, kind: ReportKind): string {
  return text
    .toUpperCase()
    .replace(/^\s*\*\s*/, '')
    .replace(/\s*\*\s*/g, ' / ')
    .replace(new RegExp(`\\s*-\\s*${kind} REQUEST\\s*$`), '')
    .replace(new RegExp(`\\b${kind}\\b`, 'g'), '')
    .replace(/\b\d{8}\b|\b\d{4}[/-]\d{2}[/-]\d{2}\b/g, '')
    .replace(/\s+/g, ' ')
    .replace(/^[\s\-/]+|[\s\-/]+$/g, '')
    .replace(/\s+-\s+(-\s+)+/g, ' - ')
    .trim()
}

/** Keeps whole clauses while they fit; a first clause that alone is too long is cut with "…". */
function fit(text: string): string {
  if (words(text).length <= OVERVIEW_WORD_LIMIT) return text
  const lean = text
    .split(' ')
    .filter((w) => !OVERVIEW_FILLER_WORDS.has(w))
    .join(' ')
  if (words(lean).length <= OVERVIEW_WORD_LIMIT) return lean

  const kept: string[] = []
  for (const clause of lean.split(CLAUSE_SPLIT)) {
    if (words([...kept, clause].join(' ')).length > OVERVIEW_WORD_LIMIT) break
    kept.push(clause)
  }
  if (kept.length) return kept.join(' - ')
  const tokens = lean.split(' ')
  let count = 0
  const cut = tokens.findIndex((w) => /\w/.test(w) && ++count > OVERVIEW_WORD_LIMIT)
  return `${tokens.slice(0, cut).join(' ').replace(/[\s\-/&]+$/, '')}…`
}

/** "FEM MEETING - 20260807 TRAVEL SHEET ENTRY - DATETIME INPUTS AND …" → a line of at most the word limit. */
export function phraseOverviewItem(text: string, kind: ReportKind): OverviewItem {
  const original = text.replace(/\s+/g, ' ').trim()
  let short = strip(original, kind)
  if (words(short).length > OVERVIEW_WORD_LIMIT) {
    for (const [pattern, replacement] of OVERVIEW_PHRASES) short = short.replace(pattern, replacement)
    short = fit(short.replace(/\s+/g, ' ').trim())
  }
  return { text: short || original, original, shortened: short !== original.toUpperCase() }
}

/** Shared words ÷ all distinct words of the two items. */
function overlap(a: string, b: string): number {
  const setA = new Set(words(a.replace(/[^\w\s]/g, ' ')))
  const setB = new Set(words(b.replace(/[^\w\s]/g, ' ')))
  const shared = [...setA].filter((w) => setB.has(w)).length
  return shared / Math.max(1, new Set([...setA, ...setB]).size)
}

/**
 * The Monthly Overview: every item phrased to fit, then repeats dropped (the same update logged on
 * several days, or a meeting about it) — the first, earliest one is kept.
 */
export function buildOverview(remarks: string[], kind: ReportKind): OverviewItem[] {
  const items: OverviewItem[] = []
  for (const remark of remarks) {
    const item = phraseOverviewItem(remark, kind)
    if (!items.some((kept) => overlap(kept.text, item.text) >= OVERVIEW_SAME_ITEM_OVERLAP)) items.push(item)
  }
  return items
}
