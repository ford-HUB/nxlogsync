import { Keyboard, Play, RotateCcw } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { type ReactNode, useEffect, useMemo, useState } from 'react'
import { EFFECT_SECONDS, STAGE } from '@/constants/run-yourself'
import { ROOM_CEILING, ROOM_CHAPTER_SIZE, ROOM_DEATH_SECONDS, ROOM_LEVELS } from '@/constants/run-rooms'
import { ALL_IMAGES, PROPS, SPRITES } from '@/constants/run-yourself-sprites'
import { placePieces, roomFlipped } from '@/lib/run-room-engine'
import { frameAt } from '@/lib/run-stage-layout'
import { cn } from '@/lib/utils'
import type { PassOrFallProgress, PlacedPiece, RoomState } from '@/types/run-rooms'
import { EffectView } from './stage-props'
import { StageBox, StageSprite } from './stage-sprite'

/** Units walked per frame of the run cycle, and the idle loop's pace. */
const STRIDE_UNITS = 26
const IDLE_FRAME_MS = 110
const GROUND_TILE = 210
const SKYLINE_TILE = 290
const chapterOf = (level: number) => Math.floor(level / ROOM_CHAPTER_SIZE) + 1

/** How long the runner takes to fade into the door. */
const ENTER_DOOR_SECONDS = 0.35

function PieceView({ piece: p, t }: { piece: PlacedPiece; t: number }) {
  // A trap winding up: the piece trembles, the only warning there is.
  const style = p.shaking ? { transform: `translate(${Math.sin(t * 90) * 2}px, ${Math.cos(t * 70)}px)` } : undefined
  switch (p.kind) {
    case 'floor':
      return (
        <StageBox
          x={p.x}
          lift={p.y}
          width={p.w}
          height={p.h + 8}
          className="bg-repeat-x grayscale"
          style={{ ...style, backgroundImage: `url(${PROPS.ground})`, backgroundSize: `${(GROUND_TILE / p.w) * 100}% 100%` }}
        />
      )
    case 'block':
      // Like the runner's hanging blocks: white in light, black in dark, outlined like the art.
      return (
        <StageBox x={p.x} lift={p.y} width={p.w} height={p.h} className="rounded-sm border-2 border-foreground bg-white dark:bg-black" style={style} />
      )
    case 'rocks':
      return (
        <StageBox x={p.x - 8} lift={p.y - 2} width={p.w + 16} height={p.h + 10} style={style}>
          <img src={PROPS.rocks} alt="" draggable={false} className="size-full grayscale" />
        </StageBox>
      )
    case 'crusher':
      // The pack's wall, hung from the ceiling on two ropes.
      return (
        <>
          {[0.25, 0.75].map((k) => (
            <StageBox
              key={k}
              x={p.x + p.w * k}
              lift={p.y + p.h}
              width={1.5}
              height={Math.max(0, ROOM_CEILING - p.y - p.h)}
              className="bg-foreground/60"
            />
          ))}
          <StageBox x={p.x} lift={p.y} width={p.w} height={p.h} style={style}>
            <img src={PROPS.wall} alt="" draggable={false} className="size-full grayscale" />
          </StageBox>
        </>
      )
    case 'door':
    case 'decoy':
      return (
        <StageBox x={p.x} lift={p.y} width={p.w} height={p.h} style={style}>
          <span className="block size-full rounded-t-md border-2 border-b-0 border-foreground bg-foreground/10">
            <span className="absolute top-1/2 right-[18%] size-1.5 rounded-full bg-foreground" />
          </span>
          <span className="absolute -top-1 left-1/2 -translate-x-1/2 -translate-y-full rounded-sm bg-foreground px-1.5 py-0.5 font-mono text-[10px] font-semibold tracking-[0.15em] text-background">
            EXIT
          </span>
        </StageBox>
      )
  }
}

/** The runner's frame: walking by stride, the jump by how it's rising or falling, the death by how far into it. */
function runnerFrame(room: RoomState, idleFrame: number) {
  const r = room.runner
  if (room.status === 'dying') {
    return room.death === 'hit' ? frameAt(SPRITES.dead, (room.phaseFor / ROOM_DEATH_SECONDS) * SPRITES.dead.length) : SPRITES.jump[3]
  }
  if (!r.grounded) return SPRITES.jump[r.vy > 250 ? 0 : r.vy > 0 ? 1 : r.vy > -250 ? 2 : 3]
  const walking = room.status === 'playing' && room.held.left !== room.held.right
  if (walking) return SPRITES.run[Math.floor(r.stride / STRIDE_UNITS) % SPRITES.run.length]
  return SPRITES.idle[idleFrame % SPRITES.idle.length]
}

interface RoomStageProps {
  room: RoomState
  /** The keyboard is listening; otherwise the prompt asks for a click first. */
  focused: boolean
  /** Saved progress: the start screen offers Continue from it, or a New game, instead of "press any key". */
  progress: PassOrFallProgress | null
  onContinue: () => void
  onNewGame: () => void
}

/** One choice on the start screen: its key, what it does, and where it starts. */
function StartChoice({ hotkey, title, detail, primary, icon, onPick }: {
  hotkey: string
  title: string
  detail: string
  primary?: boolean
  icon: ReactNode
  onPick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onPick}
      onMouseDown={(e) => e.preventDefault()}
      className={cn(
        'flex min-w-44 flex-col items-start gap-1 rounded-lg border bg-background/90 px-4 py-2.5 text-left font-mono shadow-sm transition-colors outline-none hover:border-score/60 focus-visible:ring-2 focus-visible:ring-ring/50',
        primary && 'border-score/50',
      )}
    >
      <span className="flex w-full items-center justify-between gap-3 text-[13px] font-semibold text-foreground">
        <span className={cn('flex items-center gap-1.5', primary && 'text-score')}>
          {icon} {title}
        </span>
        <kbd className="rounded-md border bg-muted/60 px-1.5 py-0.5 text-[11px] font-normal text-foreground">{hotkey}</kbd>
      </span>
      <span className="text-[11px] text-muted-foreground">{detail}</span>
    </button>
  )
}

/**
 * One Pass or fall room: the floor slabs and blocks (wherever their traps have
 * moved them), the door, and the runner. No drawn walls: the stage's edges are the room's.
 */
export function RoomStage({ room, focused, progress, onContinue, onNewGame }: RoomStageProps) {
  const [idleFrame, setIdleFrame] = useState(0)
  const level = ROOM_LEVELS[room.level]
  const pieces = useMemo(() => placePieces(level, room.t, room.sprung), [level, room.t, room.sprung])
  const r = room.runner
  const next = ROOM_LEVELS[room.level + 1]

  useEffect(() => {
    for (const src of ALL_IMAGES) new Image().src = src
  }, [])

  useEffect(() => {
    const timer = window.setInterval(() => setIdleFrame((f) => f + 1), IDLE_FRAME_MS)
    return () => window.clearInterval(timer)
  }, [])

  const door = pieces.find((p) => p.kind === 'door')
  const runnerOpacity = room.status === 'cleared' ? Math.max(0, 1 - room.phaseFor / ENTER_DOOR_SECONDS) : 1

  return (
    <div className="relative aspect-[10/3] w-full overflow-hidden select-none">
      {/* The skyline, still and faint, through the room's back wall. */}
      <StageBox
        x={0}
        lift={-10}
        width={STAGE.width}
        height={200}
        className="bg-repeat-x opacity-15 grayscale"
        style={{ backgroundImage: `url(${PROPS.skyline})`, backgroundSize: `${(SKYLINE_TILE / STAGE.width) * 100}% 100%` }}
      />

      {pieces.map((p) => (
        <PieceView key={p.id} piece={p} t={room.t} />
      ))}

      <div className="pointer-events-none absolute inset-0" style={{ opacity: runnerOpacity }}>
        <StageSprite src={runnerFrame(room, idleFrame)} footX={r.x} lift={r.y} flip={r.facing < 0} />
      </div>

      {room.status === 'dying' && room.death === 'hit' && room.phaseFor < EFFECT_SECONDS && (
        <EffectView effect={{ id: 0, kind: 'burst', x: r.x, y: r.y + 50, age: room.phaseFor }} />
      )}
      {room.status === 'cleared' && door && room.phaseFor < EFFECT_SECONDS && (
        <EffectView effect={{ id: 0, kind: 'points', x: door.x + door.w / 2, y: door.y + door.h + 24, age: room.phaseFor, points: room.lastPoints }} />
      )}

      <span className="absolute top-[4%] left-[2.5%] font-mono text-[clamp(9px,1.2vw,12px)] tracking-[0.15em] text-muted-foreground uppercase">
        chapter {chapterOf(room.level)} · level {room.level + 1} · {level.name}
        {/* Only once it has happened: Level Devil never warns, but you should know why left went right. */}
        {roomFlipped(room) && <span className="ml-2 text-score">⇄ flipped</span>}
      </span>

      <AnimatePresence>
        {room.status === 'idle' && progress && (
          <motion.div
            key="choose"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-wrap items-center justify-center gap-3 bg-background/40"
          >
            <StartChoice
              hotkey="c"
              primary
              icon={<Play className="size-3.5" />}
              title="Continue"
              detail={`chapter ${chapterOf(progress.level)} · level ${progress.level + 1} · ${progress.points.toLocaleString()} pts`}
              onPick={onContinue}
            />
            <StartChoice
              hotkey="n"
              icon={<RotateCcw className="size-3.5" />}
              title="New game"
              detail="level 1 · your unlocked doors stay"
              onPick={onNewGame}
            />
          </motion.div>
        )}
        {room.status === 'idle' && !progress && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <motion.span
              animate={{ opacity: [1, 0.55, 1] }}
              transition={{ duration: 1.6, repeat: Infinity }}
              className="flex items-center gap-2 rounded-full border bg-background/85 px-4 py-1.5 font-mono text-[13px] text-foreground shadow-sm"
            >
              <Keyboard className="size-4 text-score" />
              {focused ? 'Press any key to start' : 'Click here, then press any key to start'}
            </motion.span>
          </motion.div>
        )}
        {room.status === 'cleared' && room.phaseFor > ENTER_DOOR_SECONDS && (
          <motion.div
            key={`cleared-${room.level}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-background/80 font-mono"
          >
            <motion.span
              initial={{ scale: 0.8, y: 6 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 420, damping: 20 }}
              className={cn('text-[clamp(1.25rem,3.6vw,2.25rem)] font-semibold', next ? 'text-foreground' : 'text-score')}
            >
              {next ? `Level ${room.level + 2}` : 'You got out'}
            </motion.span>
            {next && (
              <span className="text-[12px] text-muted-foreground">
                {/* A new chapter is announced: the rooms are about to get meaner. */}
                {chapterOf(room.level + 1) > chapterOf(room.level) && (
                  <span className="mr-1.5 text-score">chapter {chapterOf(room.level + 1)} ·</span>
                )}
                {next.name}
              </span>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
