import { Pause, Play, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { NEXT_PREVIEW } from '@/constants/tetris'
import { useTetris } from '@/hooks/use-tetris'
import { useTetrisLeaderboard } from '@/hooks/use-tetris-leaderboard'
import { cn } from '@/lib/utils'
import { tetrisBestKey, useTetrisStore } from '@/store/tetris-store'
import { useSiteSessionStore } from '@/store/site-session-store'
import { useTypingLeaderboardStore } from '@/store/typing-leaderboard-store'
import { GameConfigBar } from './ui/game-config-bar'
import { GameResults } from './ui/game-results'
import { GameStats } from './ui/game-stats'
import { PiecePreview } from './ui/piece-preview'
import { SkillSlots } from './ui/skill-slots'
import { SkillsDialog } from './ui/skills-dialog'
import { TetrisBoard } from './ui/tetris-board'
import { TetrisLeaderboard } from './ui/tetris-leaderboard'

interface TetrisGameProps {
  onBack: () => void
  /** Shown but not listening for keys, e.g. behind the name prompt. */
  paused?: boolean
}

/** The footer's key hints. */
const KEYS: [string, string][] = [
  ['← →', 'move'],
  ['↑', 'rotate'],
  ['space', 'drop'],
  ['c', 'hold'],
  ['v', 'skill'],
  ['p', 'pause'],
  ['tab', 'restart'],
  ['esc', 'close'],
]

/**
 * Tetris over the blurred daily log, laid out like the typing test: score, lines, level and time
 * on top, the well between the held piece and the queue, and the leaderboard on the right edge.
 */
export function TetrisGame({ onBack, paused = false }: TetrisGameProps) {
  const game = useTetris()
  const setConfig = useTetrisStore((s) => s.setConfig)
  const best = useTetrisStore((s) => s.bests[tetrisBestKey(s.config)])
  // One leaderboard name for both games, set in whichever asked first.
  const playerName = useTypingLeaderboardStore((s) => s.playerName)
  const connected = useSiteSessionStore((s) => s.target.userId !== null)
  const setup = tetrisBestKey(game.config)
  const leaderboard = useTetrisLeaderboard(setup)
  const { submitScore } = leaderboard
  const { status, result, togglePause } = game
  const running = status === 'running'
  const playing = running || status === 'paused'
  // The skills list pauses a running game and takes the keyboard (Escape closes the list, not the game).
  const [skillsOpen, setSkillsOpen] = useState(false)
  const listening = !paused && !skillsOpen
  const showSkills = () => {
    if (running) togglePause()
    setSkillsOpen(true)
  }

  // Every key goes to the game, ahead of the daily log underneath; Escape closes it.
  const keyRef = useRef(game.onKeyDown)
  keyRef.current = game.onKeyDown
  const keyUpRef = useRef(game.onKeyUp)
  keyUpRef.current = game.onKeyUp
  useEffect(() => {
    if (!listening) return
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
    const onKey = (e: KeyboardEvent) => {
      e.stopPropagation()
      if (e.key === 'Escape') onBack()
      else keyRef.current(e)
    }
    const onKeyUp = (e: KeyboardEvent) => {
      e.stopPropagation()
      keyUpRef.current(e)
    }
    window.addEventListener('keydown', onKey, true)
    window.addEventListener('keyup', onKeyUp, true)
    return () => {
      window.removeEventListener('keydown', onKey, true)
      window.removeEventListener('keyup', onKeyUp, true)
    }
  }, [onBack, listening])

  // Leaving the window pauses the game, so a piece doesn't fall unseen.
  const runningRef = useRef(running)
  runningRef.current = running
  useEffect(() => {
    const onBlur = () => {
      if (runningRef.current) togglePause()
    }
    window.addEventListener('blur', onBlur)
    return () => window.removeEventListener('blur', onBlur)
  }, [togglePause])

  // Every finished game goes to the server, which keeps it only when it is a personal best.
  useEffect(() => {
    if (result && playerName && connected)
      void submitScore(tetrisBestKey(result.config), result.score, result.lines, result.level)
  }, [result, playerName, connected, submitScore])

  // The best on the server (maybe set on another machine) or on this one, whichever is higher.
  const serverBest = leaderboard.board?.you
  const ownBest = serverBest && serverBest.score >= (best?.score ?? 0) ? serverBest : best

  // The board ranks the best game, or this one as soon as it is beating it.
  const liveLeads = playing && game.score > (ownBest?.score ?? 0)
  const boardScore = liveLeads ? game.score : ownBest?.score
  const boardLines = liveLeads ? game.lines : ownBest?.lines

  return (
    <div className="relative min-h-dvh w-full">
      {/* The leaderboard hugs the window's right edge; the game stays centred, narrowed to clear it. */}
      <div className="absolute inset-y-16 right-6 hidden w-[22rem] min-[1440px]:block">
        <TetrisLeaderboard
          startLevel={game.config.startLevel}
          playerName={playerName ?? ''}
          entries={leaderboard.board?.entries}
          loading={leaderboard.loading}
          error={leaderboard.error}
          onRetry={leaderboard.retry}
          live={leaderboard.live}
          signedOut={!connected}
          score={boardScore}
          lines={boardLines}
          level={game.level}
        />
      </div>
      <div className="relative mx-auto flex min-h-dvh w-full max-w-5xl flex-col px-4 py-3 sm:px-8 min-[1440px]:max-w-[min(64rem,calc(100vw-50rem))] [@media(min-height:720px)]:py-6">
        <div className={cn('flex items-start justify-between gap-3 transition-opacity duration-200', running && 'pointer-events-none opacity-0')}>
          <div className="w-9" />
          {!result && <GameConfigBar config={game.config} onChange={setConfig} hidden={playing} />}
          <Button type="button" variant="ghost" size="icon" aria-label="Close Tetris" className="text-muted-foreground" onClick={onBack}>
            <X />
          </Button>
        </div>

        <div className="flex flex-1 flex-col justify-center gap-4 py-4 [@media(min-height:720px)]:gap-8 [@media(min-height:720px)]:py-8">
          <AnimatePresence mode="wait" initial={false}>
            {result ? (
              <motion.div key="results" exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                <GameResults result={result} onPlayAgain={game.restart} />
              </motion.div>
            ) : (
              <motion.div
                key="game"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="flex flex-col gap-4 [@media(min-height:720px)]:gap-8"
              >
                <GameStats score={game.score} lines={game.lines} level={game.level} seconds={game.seconds} idle={status === 'idle'} />

                <div className="flex items-start justify-center gap-6">
                  <PiecePreview label="hold" pieces={[game.hold]} dimmed={!game.canHold} />
                  <TetrisBoard
                    board={game.board}
                    gems={game.gems}
                    piece={game.piece}
                    ghost={game.config.ghost}
                    armed={game.armed}
                    clearing={game.clearing}
                    over={status === 'over'}
                    level={game.level}
                    running={running}
                    skillFx={game.skillFx}
                    slowed={game.slowLeft > 0}
                    callout={game.callout}
                  >
                    {status === 'idle' && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center font-mono text-[13px] text-foreground">
                        <Play className="size-4" />
                        Press space or an arrow key to start
                      </div>
                    )}
                    {status === 'paused' && (
                      <button
                        type="button"
                        onClick={togglePause}
                        className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/70 font-mono text-[13px] text-foreground backdrop-blur-sm"
                      >
                        <Pause className="size-4" />
                        Paused · press p or space to resume
                      </button>
                    )}
                  </TetrisBoard>
                  <div className="flex flex-col gap-8">
                    <PiecePreview label="next" pieces={game.queue.slice(0, NEXT_PREVIEW)} />
                    <SkillSlots skills={game.skills} armed={game.armed} slowLeft={game.slowLeft} onShowSkills={showSkills} />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <SkillsDialog open={skillsOpen} onClose={() => setSkillsOpen(false)} />

        <footer className="flex flex-wrap justify-center gap-x-6 gap-y-2 font-mono text-[12px] text-muted-foreground">
          {KEYS.map(([key, label]) => (
            <span key={label} className="flex items-center gap-2">
              <kbd className="rounded-md border bg-muted/60 px-1.5 py-0.5 text-foreground">{key}</kbd> {label}
            </span>
          ))}
        </footer>
      </div>
    </div>
  )
}
