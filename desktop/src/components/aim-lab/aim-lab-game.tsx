import { MousePointerClick } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef } from 'react'
import { AimLabFps } from '@/components/aim-lab/ui/aim-lab-fps'
import { AimLabHud } from '@/components/aim-lab/ui/aim-lab-hud'
import { AimLabKeyHints } from '@/components/aim-lab/ui/aim-lab-key-hints'
import { AimLabLeaderboard } from '@/components/aim-lab/ui/aim-lab-leaderboard'
import { AimLabLobby } from '@/components/aim-lab/ui/aim-lab-lobby'
import { AimLabPause } from '@/components/aim-lab/ui/aim-lab-pause'
import { AimLabTimeBar } from '@/components/aim-lab/ui/aim-lab-time-bar'
import { AIM_LAB_CANVAS_ID, AIM_LAB_MISSING } from '@/constants/aim-lab'
import { useAimLab } from '@/hooks/use-aim-lab'
import { useAimLabLeaderboard } from '@/hooks/use-aim-lab-leaderboard'
import { useFrameRate } from '@/hooks/use-frame-rate'

/** How long after pausing an Esc is taken as the one that paused, not a request to exit. */
const ESC_GRACE_MS = 300

interface AimLabGameProps {
  onBack: () => void
  playerName: string
  /** Not started yet, e.g. behind the name prompt. */
  paused?: boolean
}

/**
 * The Unity gridshot range filling the window, with every screen drawn on top of it. Like the other
 * games: the round length along the top, its leaderboard on the right, the controls along the bottom.
 * Tab starts or restarts a round. Esc pauses one (the browser releases the mouse), exits it from the
 * pause screen, or closes the trainer from the start screen.
 */
export function AimLabGame({ onBack, playerName, paused = false }: AimLabGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const aim = useAimLab(canvasRef, !paused)
  const { status, progress, loadError, game, lastRound, bestRound, seconds, start, quit, resume } = aim
  const ready = status === 'ready'
  const { phase } = game
  const inRound = phase === 'armed' || phase === 'running' || phase === 'paused'
  const lobby = ready && !inRound
  const frameRate = useFrameRate(ready)
  const leaderboard = useAimLabLeaderboard(aim.setup)
  // The best on the server (maybe set on another machine) or this session's, whichever is higher.
  const serverBest = leaderboard.board?.you ?? undefined
  const boardBest = serverBest && serverBest.score >= (bestRound?.score ?? 0) ? serverBest : (bestRound ?? undefined)

  // When the round last paused: the Esc that paused it can arrive after the pause screen is up, and
  // mustn't also exit the round.
  const pausedAtRef = useRef(0)
  useEffect(() => {
    if (phase === 'paused') pausedAtRef.current = performance.now()
  }, [phase])

  // Tab and Esc go to the trainer, ahead of the daily log underneath. Esc while the mouse is locked
  // is the browser's (it releases the lock, which pauses the round); the game gets every other key.
  const keyRef = useRef({ ready, phase, inRound, start, quit, onBack })
  keyRef.current = { ready, phase, inRound, start, quit, onBack }
  useEffect(() => {
    if (paused) return
    const onKey = (e: KeyboardEvent) => {
      const k = keyRef.current
      if (e.key === 'Escape') {
        e.stopPropagation()
        if (document.pointerLockElement || k.phase === 'running') return
        if (k.phase === 'paused') {
          if (performance.now() - pausedAtRef.current > ESC_GRACE_MS) k.quit()
        } else if (k.inRound) k.quit()
        else k.onBack()
      } else if (e.key === 'Tab') {
        e.preventDefault()
        e.stopPropagation()
        if (k.ready) k.start()
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [paused])

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-black">
      <canvas ref={canvasRef} id={AIM_LAB_CANVAS_ID} tabIndex={-1} className="absolute inset-0 size-full outline-none" />

      {ready && inRound && <AimLabHud game={game} />}
      {ready && <AimLabFps rate={frameRate} />}

      <AnimatePresence>
        {lobby && (
          <motion.div
            key="lobby"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="absolute inset-0 overflow-y-auto bg-black/60"
          >
            {/* The leaderboard hugs the window's right edge at Tetris's full width, as in Tetris's roomy layout; the time bar
                and the card stay centred, narrowed to clear it. Narrower windows stack it under the card. */}
            <div className="flex min-h-full flex-col items-center gap-6 px-4 pt-4 pb-16 lg:pr-[23rem] min-[1440px]:px-[24rem]">
              <AimLabTimeBar seconds={seconds} onChange={aim.setSeconds} />
              <div className="flex w-full flex-1 flex-col items-center justify-center">
                <AimLabLobby
                  seconds={seconds}
                  lastRound={phase === 'results' ? lastRound : null}
                  bestRound={bestRound}
                  sensitivity={aim.sensitivity}
                  onSensitivityChange={aim.setSensitivity}
                  onStart={start}
                />
              </div>
              <div className="relative h-[28rem] w-full max-w-[22rem] py-6 lg:absolute lg:top-4 lg:right-6 lg:bottom-16 lg:h-auto lg:w-[22rem]">
                {/* A backdrop so the names read over the range, fading out at every edge instead of a hard border. */}
                <div
                  aria-hidden
                  className="absolute inset-0 bg-background/85 [mask-composite:intersect] [mask-image:linear-gradient(to_right,transparent,black_2.5rem,black_calc(100%-2.5rem),transparent),linear-gradient(to_bottom,transparent,black_3rem,black_calc(100%-3rem),transparent)]"
                />
                <AimLabLeaderboard
                  seconds={seconds}
                  playerName={playerName}
                  entries={leaderboard.board?.entries}
                  loading={leaderboard.loading}
                  error={leaderboard.error}
                  onRetry={leaderboard.retry}
                  signedOut={leaderboard.signedOut}
                  best={boardBest}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {ready && phase === 'paused' && <AimLabPause key="pause" game={game} onResume={resume} onExit={quit} />}
      </AnimatePresence>

      {/* Clicks fall through to the canvas, where the browser grants the mouse lock that starts the clock. */}
      {ready && phase === 'armed' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
        >
          <div className="flex flex-col items-center gap-3 rounded-2xl bg-black/60 px-8 py-6 text-center font-mono text-white">
            <MousePointerClick className="size-6" />
            <span className="text-lg font-semibold">Click to start</span>
            <span className="text-[12px] text-white/70">The clock starts on your first click.</span>
          </div>
        </motion.div>
      )}

      {status === 'loading' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 font-mono text-[13px] text-white/70">
          <span>Loading · {Math.round(progress * 100)}%</span>
          <div className="h-1 w-48 overflow-hidden rounded-full bg-white/15">
            <div className="h-full rounded-full bg-white/80 transition-[width]" style={{ width: `${progress * 100}%` }} />
          </div>
        </div>
      )}
      {status === 'error' && (
        <div className="absolute inset-0 flex items-center justify-center px-6 text-center font-mono text-[13px] text-white/70">
          {loadError === AIM_LAB_MISSING
            ? "PewPew isn't installed in this build yet."
            : `PewPew couldn't start: ${loadError}`}
        </div>
      )}

      {ready && <AimLabKeyHints phase={phase} />}

      {aim.submitError && phase === 'results' && (
        <p className="absolute bottom-12 left-1/2 -translate-x-1/2 font-mono text-[12px] text-white/70">
          Score not saved: {aim.submitError}
        </p>
      )}
    </div>
  )
}
