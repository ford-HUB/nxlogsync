import { motion } from 'motion/react'
import { useLayoutEffect, useRef, useState } from 'react'
import { VISIBLE_LINES } from '@/constants/typing-test'
import type { TypingSession } from '@/hooks/use-typing-test'
import { cn } from '@/lib/utils'

interface WordsDisplayProps {
  session: TypingSession
  focused: boolean
}

/** Words after the caret that are rendered at all; the rest wait off-screen. */
const LOOKAHEAD = 80

/**
 * The words to type, monkeytype style: untyped letters dim, typed ones bright, mistakes red,
 * extra letters appended in faded red, and a wrong finished word underlined. Three lines show
 * at a time and scroll a line at a time so the caret stays on the middle one.
 */
export function WordsDisplay({ session, focused }: WordsDisplayProps) {
  const { words, typed, input, status } = session
  const current = typed.length
  const containerRef = useRef<HTMLDivElement>(null)
  const activeRef = useRef<HTMLSpanElement>(null)
  const [lineHeight, setLineHeight] = useState(0)
  const [scroll, setScroll] = useState(0)
  const [caret, setCaret] = useState({ x: 0, y: 0, h: 0 })

  // Place the caret after the last typed letter, and scroll so its line is the middle one.
  useLayoutEffect(() => {
    const word = activeRef.current
    const container = containerRef.current
    if (!word || !container) return
    const letters = word.querySelectorAll<HTMLElement>('[data-letter]')
    const at = letters[Math.min(input.length, letters.length - 1)]
    const afterLast = input.length >= letters.length
    // Letters are positioned against the container too (the word itself is not positioned).
    const x = at ? at.offsetLeft + (afterLast ? at.offsetWidth : 0) : word.offsetLeft
    const lh = word.offsetHeight
    setLineHeight(lh)
    setCaret({ x, y: word.offsetTop, h: lh })
    const line = Math.round(word.offsetTop / lh)
    setScroll(Math.max(0, line - 1) * lh)
  }, [input, current, words])

  const end = Math.min(words.length, current + LOOKAHEAD)

  return (
    <div
      className={cn('relative overflow-hidden transition-[filter,opacity] duration-200', !focused && 'opacity-40 blur-[3px]')}
      style={{ height: lineHeight ? lineHeight * VISIBLE_LINES : undefined }}
    >
      <motion.div
        ref={containerRef}
        animate={{ y: -scroll }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
        className="relative flex flex-wrap font-mono text-[1.75rem] leading-[3.25rem] tracking-tight select-none"
      >
        {words.slice(0, end).map((word, i) => {
          const done = i < current
          const active = i === current
          const value = done ? typed[i] : active ? input : ''
          const wrong = done && value !== word
          const extra = value.slice(word.length)
          return (
            <span
              key={i}
              ref={active ? activeRef : undefined}
              className={cn(
                'mr-[0.5em] border-b-2 border-transparent',
                wrong && 'border-destructive/70',
              )}
            >
              {word.split('').map((letter, j) => (
                <span
                  key={j}
                  data-letter
                  className={cn(
                    'transition-colors duration-75',
                    j >= value.length
                      ? 'text-muted-foreground/40'
                      : value[j] === letter
                        ? 'text-foreground'
                        : 'text-destructive',
                  )}
                >
                  {letter}
                </span>
              ))}
              {extra.split('').map((letter, j) => (
                <span key={`x${j}`} data-letter className="text-destructive/60">
                  {letter}
                </span>
              ))}
            </span>
          )
        })}

        {status !== 'finished' && caret.h > 0 && (
          <motion.span
            aria-hidden
            initial={false}
            animate={{ x: caret.x, y: caret.y + caret.h * 0.2 }}
            transition={{ type: 'spring', stiffness: 900, damping: 50, mass: 0.4 }}
            style={{ height: caret.h * 0.6 }}
            className={cn(
              'pointer-events-none absolute top-0 left-0 -ml-px w-[2px] rounded-full bg-foreground',
              status === 'idle' && focused && 'animate-[caret-blink_1s_step-end_infinite]',
            )}
          />
        )}
      </motion.div>
    </div>
  )
}
