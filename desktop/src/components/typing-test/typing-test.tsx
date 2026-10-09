import { Lock, MousePointerClick, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { useTypingTest } from '@/hooks/use-typing-test'
import { cn } from '@/lib/utils'
import { useTypingTestStore } from '@/store/typing-test-store'
import { LiveStats } from './ui/live-stats'
import { OnScreenKeyboard } from './ui/on-screen-keyboard'
import { TestConfigBar } from './ui/test-config-bar'
import { TestResults } from './ui/test-results'
import { WordsDisplay } from './ui/words-display'

interface TypingTestProps {
  onBack: () => void
}

/** The keyboard's name for a key event: a lowercase letter, or 'space'. */
const keyName = (e: KeyboardEvent) => (e.key === ' ' ? 'space' : e.key.toLowerCase())

/**
 * A monkeytype-style typing test over the blurred daily log: live wpm, accuracy and time on top,
 * the words, and an on-screen keyboard that lights up as you type. The results are yellow.
 */
export function TypingTest({ onBack }: TypingTestProps) {
  const test = useTypingTest()
  const setConfig = useTypingTestStore((s) => s.setConfig)
  const { session, config, elapsedMs, liveWpm, liveAccuracy, result } = test
  const running = session.status === 'running'
  const [focused, setFocused] = useState(() => document.hasFocus())
  const [pressed, setPressed] = useState<ReadonlySet<string>>(new Set())

  // Every key goes to the test, ahead of the daily log underneath; Escape closes it.
  const keyRef = useRef(test.onKeyDown)
  keyRef.current = test.onKeyDown
  useEffect(() => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
    const onKey = (e: KeyboardEvent) => {
      e.stopPropagation()
      if (e.key === 'Escape') {
        onBack()
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
    window.addEventListener('keydown', onKey, true)
    window.addEventListener('keyup', onKeyUp, true)
    window.addEventListener('blur', onBlur)
    return () => {
      window.removeEventListener('keydown', onKey, true)
      window.removeEventListener('keyup', onKeyUp, true)
      window.removeEventListener('blur', onBlur)
    }
  }, [onBack])

  const elapsed = Math.floor(elapsedMs / 1000)
  const seconds = config.mode === 'time' ? Math.max(0, config.amount - elapsed) : elapsed

  return (
    <div className="relative mx-auto flex min-h-dvh w-full max-w-5xl flex-col px-4 py-6 sm:px-8">
      <div
        className={cn(
          'flex items-start justify-between gap-3 transition-opacity duration-200',
          running && 'pointer-events-none opacity-0',
        )}
      >
        <div className="w-9" />
        {!result && <TestConfigBar config={config} onChange={setConfig} hidden={running} />}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Close typing test"
          className="text-muted-foreground"
          onClick={onBack}
        >
          <X />
        </Button>
      </div>

      <div className="flex flex-1 flex-col justify-center gap-10 py-10">
        <AnimatePresence mode="wait" initial={false}>
          {result ? (
            <motion.div key="results" exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              <TestResults result={result} onNext={() => test.restart()} onRepeat={() => test.restart(true)} />
            </motion.div>
          ) : (
            <motion.div
              key="test"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col gap-10"
            >
              <div className="relative">
                <LiveStats wpm={liveWpm} accuracy={liveAccuracy} seconds={seconds} idle={session.status === 'idle'} />
                <AnimatePresence>
                  {test.capsLock && (
                    <motion.span
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="absolute top-1/2 right-0 flex -translate-y-1/2 items-center gap-1.5 rounded-md bg-foreground px-2 py-1 font-mono text-[12px] text-background"
                    >
                      <Lock className="size-3" /> Caps Lock
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>

              <div className="relative" onClick={() => setFocused(true)}>
                <WordsDisplay session={session} focused={focused} />
                {!focused && (
                  <div className="absolute inset-0 flex cursor-pointer items-center justify-center gap-2 text-[14px] text-foreground">
                    <MousePointerClick className="size-4" /> Click here or press any key to focus
                  </div>
                )}
              </div>

              <OnScreenKeyboard pressed={pressed} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <footer className="flex justify-center gap-6 font-mono text-[12px] text-muted-foreground">
        <span className="flex items-center gap-2">
          <kbd className="rounded-md border bg-muted/60 px-1.5 py-0.5 text-foreground">tab</kbd> restart
        </span>
        <span className="flex items-center gap-2">
          <kbd className="rounded-md border bg-muted/60 px-1.5 py-0.5 text-foreground">esc</kbd> close
        </span>
      </footer>
    </div>
  )
}
