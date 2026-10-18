import { Lock, MousePointerClick, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { useTypingKeys } from '@/hooks/use-typing-keys'
import { useLeaderboard } from '@/hooks/use-typing-leaderboard'
import { useTypingTest } from '@/hooks/use-typing-test'
import { cn } from '@/lib/utils'
import { useTypingLeaderboardStore } from '@/store/typing-leaderboard-store'
import { bestKey, useTypingTestStore } from '@/store/typing-test-store'
import { Leaderboard } from './ui/leaderboard'
import { LiveStats } from './ui/live-stats'
import { OnScreenKeyboard } from './ui/on-screen-keyboard'
import { TestConfigBar } from './ui/test-config-bar'
import { TestResults } from './ui/test-results'
import { WordsDisplay } from './ui/words-display'

interface TypingTestProps {
  onBack: () => void
  /** Shown but not listening for keys, e.g. behind the name prompt. */
  paused?: boolean
}

/** The live wpm only counts toward the leaderboard after this long, past the first-second spikes. */
const LIVE_RANK_AFTER_MS = 2000

/**
 * A monkeytype-style typing test over the blurred daily log: live wpm, accuracy and time on top,
 * the words, and an on-screen keyboard that lights up as you type. The results are yellow.
 */
export function TypingTest({ onBack, paused = false }: TypingTestProps) {
  const test = useTypingTest()
  const setConfig = useTypingTestStore((s) => s.setConfig)
  const playerName = useTypingLeaderboardStore((s) => s.playerName)
  const localBest = useTypingTestStore((s) => s.bests[bestKey(s.config)])
  const localBestAccuracy = useTypingTestStore((s) => s.bestAccuracies[bestKey(s.config)])
  const { session, config, elapsedMs, liveWpm, liveAccuracy, result } = test
  const leaderboard = useLeaderboard(bestKey(config))
  const live = useTypingLeaderboardStore((s) => s.live)
  const { submitScore } = leaderboard

  // The best on the server (maybe set on another machine) or on this one, whichever is faster.
  const serverBest = leaderboard.board?.you
  const useServer = serverBest !== null && serverBest !== undefined && serverBest.wpm >= (localBest ?? 0)
  const best = useServer ? serverBest.wpm : localBest
  const bestAccuracy = useServer ? serverBest.accuracy : localBestAccuracy

  // Every finished run goes to the server, which keeps it only when it is a personal best.
  useEffect(() => {
    if (result && playerName) void submitScore(bestKey(result.config), result.wpm, result.accuracy)
  }, [result, playerName, submitScore])
  const running = session.status === 'running'
  // Every key goes to the test, ahead of the daily log underneath; Escape closes it.
  const { focused, setFocused, pressed } = useTypingKeys({ onKey: test.onKeyDown, onEscape: onBack, paused })

  const elapsed = Math.floor(elapsedMs / 1000)
  const seconds = config.mode === 'time' ? Math.max(0, config.amount - elapsed) : elapsed
  // The board ranks the best run, or this run as soon as it is beating it.
  const liveLeads = running && elapsedMs >= LIVE_RANK_AFTER_MS && liveWpm > (best ?? 0)
  const boardWpm = liveLeads ? liveWpm : best
  const boardAccuracy = liveLeads ? liveAccuracy : bestAccuracy

  return (
    <div className="relative min-h-dvh w-full">
      {/* The leaderboard hugs the window's right edge, compact below 1440px; the test stays centred, narrowed to clear it. */}
      <div className="absolute inset-y-16 right-3 hidden w-[13.5rem] lg:block min-[1440px]:right-6 min-[1440px]:w-[22rem]">
        <Leaderboard
          config={config}
          playerName={playerName ?? ''}
          entries={leaderboard.board?.entries}
          loading={leaderboard.loading}
          error={leaderboard.error}
          onRetry={leaderboard.retry}
          live={live}
          wpm={boardWpm}
          accuracy={boardAccuracy}
        />
      </div>
      <div className="relative mx-auto flex min-h-dvh w-full max-w-5xl flex-col px-4 py-3 sm:px-8 lg:max-w-[min(64rem,calc(100vw-28.5rem))] min-[1440px]:max-w-[min(64rem,calc(100vw-50rem))] [@media(min-height:720px)]:py-6">
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

        <div className="flex flex-1 flex-col justify-center gap-4 py-4 [@media(min-height:720px)]:gap-10 [@media(min-height:720px)]:py-10">
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
                className="flex flex-col gap-4 [@media(min-height:720px)]:gap-10"
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
    </div>
  )
}
