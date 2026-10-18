import { useEffect, useRef, useState } from 'react'
import { useTypingDuelStore } from '@/store/typing-duel-store'

/** The keyboard's name for a key event: a lowercase letter, or 'space'. */
const keyName = (e: KeyboardEvent) => (e.key === ' ' ? 'space' : e.key.toLowerCase())

interface TypingKeysOptions {
  /** Every other key, for the test. */
  onKey: (e: KeyboardEvent) => void
  onEscape: () => void
  /** Not listening, e.g. behind a dialog. */
  paused?: boolean
}

/**
 * Takes every key for a typing test, ahead of the daily log underneath, while not paused:
 * Escape goes to onEscape, the rest to onKey. Tracks the keys held (for the on-screen keyboard)
 * and whether the window has focus.
 */
export function useTypingKeys({ onKey, onEscape, paused = false }: TypingKeysOptions) {
  const [focused, setFocused] = useState(() => document.hasFocus())
  const [pressed, setPressed] = useState<ReadonlySet<string>>(new Set())

  const keyRef = useRef(onKey)
  keyRef.current = onKey
  const escapeRef = useRef(onEscape)
  escapeRef.current = onEscape

  useEffect(() => {
    if (paused) return
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
    const onKeyDown = (e: KeyboardEvent) => {
      // A 1v1 invite is asking: its modal gets the keys (Enter accepts, Escape declines).
      if (useTypingDuelStore.getState().incoming.length > 0) return
      e.stopPropagation()
      if (e.key === 'Escape') {
        escapeRef.current()
        return
      }
      setFocused(true)
      const name = keyName(e)
      setPressed((prev) => (prev.has(name) ? prev : new Set(prev).add(name)))
      keyRef.current(e)
    }
    const onKeyUp = (e: KeyboardEvent) => {
      const name = keyName(e)
      setPressed((prev) => {
        if (!prev.has(name)) return prev
        const next = new Set(prev)
        next.delete(name)
        return next
      })
    }
    const onBlur = () => {
      setFocused(false)
      setPressed(new Set())
    }
    window.addEventListener('keydown', onKeyDown, true)
    window.addEventListener('keyup', onKeyUp, true)
    window.addEventListener('blur', onBlur)
    return () => {
      window.removeEventListener('keydown', onKeyDown, true)
      window.removeEventListener('keyup', onKeyUp, true)
      window.removeEventListener('blur', onBlur)
    }
  }, [paused])

  return { focused, setFocused, pressed }
}
