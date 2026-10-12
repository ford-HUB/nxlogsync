import { ChevronLeft, Keyboard, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { MOCK_RUN_LEADERBOARDS, SPEED_RUN_METRES } from '@/constants/run-yourself'
import { usePassOrFallAccount } from '@/hooks/use-pass-or-fall-account'
import { useRoomGame } from '@/hooks/use-room-game'
import { useRunGame } from '@/hooks/use-run-game'
import { controlForKey } from '@/lib/run-controls'
import { runBestKey, runBoost, toMetres } from '@/lib/run-engine'
import { cn } from '@/lib/utils'
import { useRunYourselfStore } from '@/store/run-yourself-store'
import { useSiteSessionStore } from '@/store/site-session-store'
import type { SpeedRunControl } from '@/types/run-controls'
import type { RunAction, RunConfig, SkillKind } from '@/types/run-yourself'
import { KeySettings } from './ui/key-settings'
import { ModePicker } from './ui/mode-picker'
import { RoomResults, RoomStats } from './ui/room-hud'
import { RoomStage } from './ui/room-stage'
import { RunConfigBar } from './ui/run-config-bar'
import { KeyHint, RunControls } from './ui/run-controls'
import { RunLeaderboard } from './ui/run-leaderboard'
import { RunResults } from './ui/run-results'
import { RunStage } from './ui/run-stage'
import { RunStats } from './ui/run-stats'

interface RunGameProps {
  onBack: () => void
}

const KBD = 'rounded-md border bg-muted/60 px-1.5 py-0.5 text-foreground'
const SKILLS = new Set<SpeedRunControl>(['fire', 'slow', 'phase'])

/** Keys the page would otherwise scroll with. */
const SCROLL_KEYS = new Set([' ', 'ArrowUp', 'ArrowDown'])

/**
 * Run yourself over the blurred daily log, laid out like the typing test. It opens on the choice
 * of game (Speed run, or Pass or fall's Level Devil style rooms); then the setup bar on top, the
 * game's numbers, the stage, and the controller keys down at the bottom edge, with the
 * leaderboard on the right. Any key starts a game; the effects are yellow.
 */
export function RunGame({ onBack }: RunGameProps) {
  const game = useRunGame()
  const rooms = useRoomGame()
  const { run, config, result } = game
  const { room } = rooms
  const roomsMode = config.mode === 'pass-or-fall'
  const account = usePassOrFallAccount()
  // Saved progress turns Pass or fall's start screen into a choice: Continue, or New game.
  const choosing = roomsMode && room.status === 'idle' && account.progress !== null
  const continueGame = () => rooms.start(account.progress)
  const newGame = () => rooms.start(null)
  const setConfig = useRunYourselfStore((s) => s.setConfig)
  const bests = useRunYourselfStore((s) => s.bests)
  const best = bests[runBestKey(config)]
  const bindings = useRunYourselfStore((s) => s.bindings)
  const syncBindings = useRunYourselfStore((s) => s.syncBindings)
  const userId = useSiteSessionStore((s) => s.target.userId)
  const [picking, setPicking] = useState(true)
  /** The controls screen, over the picker; it handles its own keys. */
  const [controls, setControls] = useState(false)
  const [focused, setFocused] = useState(() => document.hasFocus())

  const pressRef = useRef(game.press)
  pressRef.current = game.press
  const activateRef = useRef(game.activate)
  activateRef.current = game.activate
  const restartRef = useRef(game.restart)
  restartRef.current = game.restart
  const holdRef = useRef(rooms.hold)
  holdRef.current = rooms.hold
  const roomRestartRef = useRef(rooms.restart)
  roomRestartRef.current = rooms.restart
  const roomsModeRef = useRef(roomsMode)
  roomsModeRef.current = roomsMode
  const bindingsRef = useRef(bindings)
  bindingsRef.current = bindings
  const controlsRef = useRef(controls)
  controlsRef.current = controls
  const chooseKeyRef = useRef<((key: string) => boolean) | null>(null)
  chooseKeyRef.current = choosing
    ? (key) => {
        const k = key.toLowerCase()
        if (k === 'c' || k === 'enter') continueGame()
        else if (k === 'n') newGame()
        else return false
        return true
      }
    : null

  const pick = (next: RunConfig) => {
    setConfig(next)
    game.restart()
    rooms.restart()
    setPicking(false)
  }
  const backToModes = () => {
    game.restart()
    rooms.restart()
    setPicking(true)
  }
  // While choosing, 1 and 2 pick a game, c opens the controls, and nothing else reaches it.
  const pickKeyRef = useRef<(key: string) => void>(() => {})
  pickKeyRef.current = picking
    ? (key) => {
        if (key === '1') pick({ mode: 'speed-run' })
        if (key === '2') pick({ mode: 'pass-or-fall' })
        if (key.toLowerCase() === 'c') setControls(true)
      }
    : () => {}
  const pickingRef = useRef(picking)
  pickingRef.current = picking

  // Every key goes to the game, ahead of the daily log underneath; Escape closes, Tab restarts.
  useEffect(() => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
    const onKey = (e: KeyboardEvent) => {
      e.stopPropagation()
      if (controlsRef.current) return
      if (e.key === 'Escape') return onBack()
      if (pickingRef.current) {
        if (!e.repeat) pickKeyRef.current(e.key)
        return
      }
      if (e.key === 'Tab') {
        e.preventDefault()
        return roomsModeRef.current ? roomRestartRef.current() : restartRef.current()
      }
      if (SCROLL_KEYS.has(e.key)) e.preventDefault()
      setFocused(true)
      // Pass or fall's start screen with saved progress: only Continue or New game start it.
      if (roomsModeRef.current && chooseKeyRef.current) {
        if (!e.repeat) chooseKeyRef.current(e.key)
        return
      }
      // Pass or fall walks while a key is held, so it hears key ups too; a repeat changes nothing.
      if (roomsModeRef.current) {
        if (!e.repeat) holdRef.current(controlForKey(bindingsRef.current['pass-or-fall'], e.key), true)
        return
      }
      if (e.repeat) return
      const control = controlForKey(bindingsRef.current['speed-run'], e.key)
      if (control && SKILLS.has(control)) activateRef.current(control as SkillKind)
      else pressRef.current(control as RunAction | undefined)
    }
    const onKeyUp = (e: KeyboardEvent) => {
      if (roomsModeRef.current) {
        const move = controlForKey(bindingsRef.current['pass-or-fall'], e.key)
        if (move) holdRef.current(move, false)
      }
    }
    const onBlur = () => {
      setFocused(false)
      // Nothing stays held while the window is away, or the runner would walk on by itself.
      for (const move of ['left', 'right', 'jump'] as const) holdRef.current(move, false)
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

  // The keys follow the signed-in account.
  useEffect(() => {
    void syncBindings(userId)
  }, [userId, syncBindings])

  const playing = roomsMode ? room.status !== 'idle' && room.status !== 'finished' : run.status === 'countdown' || run.status === 'running' || run.status === 'falling'
  const points = Math.round(run.points)
  const metres = toMetres(run.distance)
  const elapsed = Math.floor(run.elapsed)
  const speedRun = config.mode === 'speed-run'
  // The clock counts up from 0 in both games; a speed run shows tenths, since that's the score.
  const seconds = speedRun ? Math.floor(run.elapsed * 10) / 10 : elapsed
  // The board ranks the best run, or this run as soon as it is beating it.
  const liveLeads = playing && points > (best?.points ?? 0)
  // Pass or fall's best is the account's on the server, or this machine's when signed out.
  const roomBest = account.board?.you ?? (best ? { points: best.points, seconds: best.seconds } : undefined)
  const roomLeads = playing && room.points > (roomBest?.points ?? 0)
  // The board adds the user's own row itself.
  const roomEntries = (account.board?.entries ?? [])
    .filter((e) => !e.you)
    .map((e) => ({ id: e.id, name: e.name, points: e.points, metres: 0, seconds: e.seconds }))
  const shownResult = roomsMode ? rooms.result : result
  const label = speedRun ? 'speed run' : 'pass or fall'

  return (
    <div className="relative min-h-dvh w-full">
      {/* No board on the game picker; it appears once a game is chosen. */}
      {!picking && (
        <div className="absolute inset-y-16 right-3 hidden w-[13.5rem] lg:block min-[1440px]:right-6 min-[1440px]:w-[22rem]">
          {roomsMode ? (
            // Ranked by points; the column is how long the escape took.
            <RunLeaderboard
              label={label}
              entries={roomEntries}
              points={roomLeads ? room.points : roomBest?.points}
              metres={0}
              seconds={roomLeads ? room.elapsed : roomBest?.seconds}
              column="time"
              boost={0.6}
            />
          ) : (
            <RunLeaderboard
              label={label}
              entries={MOCK_RUN_LEADERBOARDS[runBestKey(config)] ?? []}
              points={liveLeads ? points : best?.points}
              metres={liveLeads ? metres : best?.metres}
              seconds={liveLeads ? run.elapsed : best?.seconds}
              column={speedRun ? 'time' : 'dist'}
              boost={runBoost(run.speed)}
            />
          )}
        </div>
      )}
      <div
        className={cn(
          'relative mx-auto flex min-h-dvh w-full max-w-5xl flex-col px-4 py-3 sm:px-8 [@media(min-height:720px)]:py-6',
          !picking && 'lg:max-w-[min(64rem,calc(100vw-28.5rem))] min-[1440px]:max-w-[min(64rem,calc(100vw-50rem))]',
        )}
      >
        <div className={cn('flex items-start justify-between gap-3 transition-opacity duration-200', playing && 'pointer-events-none opacity-0')}>
          {picking ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={cn('font-mono text-[12px] text-muted-foreground', controls && 'text-foreground')}
              onClick={() => setControls((c) => !c)}
              onMouseDown={(e) => e.preventDefault()}
            >
              {controls ? (
                <>
                  <ChevronLeft /> games
                </>
              ) : (
                <>
                  <Keyboard /> controls
                </>
              )}
            </Button>
          ) : (
            <Button type="button" variant="ghost" size="sm" className="font-mono text-[12px] text-muted-foreground" onClick={backToModes}>
              <ChevronLeft /> games
            </Button>
          )}
          {!shownResult && !picking && <RunConfigBar config={config} onChange={setConfig} hidden={playing} />}
          <Button type="button" variant="ghost" size="icon" aria-label="Close Run yourself" className="text-muted-foreground" onClick={onBack}>
            <X />
          </Button>
        </div>

        <div className="flex flex-1 flex-col justify-center gap-4 py-4 [@media(min-height:720px)]:gap-8 [@media(min-height:720px)]:py-8">
          {/* The picker swaps out at once rather than through the exit animation below. */}
          {picking && controls ? (
            <motion.div key="controls" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }}>
              <KeySettings onClose={() => setControls(false)} />
            </motion.div>
          ) : picking ? (
            <motion.div key="modes" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }}>
              <ModePicker config={config} bests={bests} onPick={pick} />
            </motion.div>
          ) : (
            <AnimatePresence mode="wait" initial={false}>
              {roomsMode && rooms.result ? (
                <motion.div key="room-results" exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                  <RoomResults result={rooms.result} onRestart={rooms.restart} />
                </motion.div>
              ) : roomsMode ? (
                <motion.div
                  key="rooms"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="flex flex-col gap-4 [@media(min-height:720px)]:gap-8"
                >
                  <RoomStats points={room.points} level={room.level} deaths={room.deaths} seconds={room.elapsed} idle={room.status === 'idle'} />
                  <div onClick={() => setFocused(true)}>
                    <RoomStage
                      room={room}
                      focused={focused}
                      progress={choosing ? account.progress : null}
                      onContinue={continueGame}
                      onNewGame={newGame}
                    />
                  </div>
                </motion.div>
              ) : result ? (
                <motion.div key="results" exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                  <RunResults result={result} onRestart={game.restart} />
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
                  <RunStats
                    points={points}
                    speed={run.speed}
                    metres={metres}
                    goal={speedRun ? SPEED_RUN_METRES : undefined}
                    seconds={seconds}
                    idle={run.status === 'idle' || run.status === 'countdown'}
                  />
                  <div onClick={() => setFocused(true)}>
                    <RunStage run={run} focused={focused} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>

        {/* The controls as key hints by the window's bottom edge, like Tetris. */}
        <footer className="flex flex-wrap justify-center gap-x-6 gap-y-2 font-mono text-[12px] text-muted-foreground">
          {picking && controls ? (
            <>
              <span className="flex items-center gap-2">
                <kbd className={KBD}>enter</kbd> swap a taken key
              </span>
              <span className="flex items-center gap-2">
                <kbd className={KBD}>esc</kbd> cancel · back
              </span>
            </>
          ) : picking ? (
            <>
              <span className="flex items-center gap-2">
                <kbd className={KBD}>1</kbd>
                <kbd className={KBD}>2</kbd> pick a game
              </span>
              <span className="flex items-center gap-2">
                <kbd className={KBD}>c</kbd> controls
              </span>
            </>
          ) : choosing ? (
            <>
              <span className="flex items-center gap-2">
                <kbd className={KBD}>c</kbd> continue
              </span>
              <span className="flex items-center gap-2">
                <kbd className={KBD}>n</kbd> new game
              </span>
            </>
          ) : roomsMode ? (
            <>
              <KeyHint keys={[bindings['pass-or-fall'].left[0], bindings['pass-or-fall'].right[0]]} label="move" />
              <KeyHint keys={bindings['pass-or-fall'].jump} label="jump" />
              <span className="flex items-center gap-2">
                <kbd className={KBD}>tab</kbd> restart
              </span>
            </>
          ) : (
            <RunControls keys={bindings['speed-run']} skills={run.skills} active={run.active} />
          )}
          {!(picking && controls) && (
            <span className="flex items-center gap-2">
              <kbd className={KBD}>esc</kbd> close
            </span>
          )}
        </footer>
      </div>
    </div>
  )
}
