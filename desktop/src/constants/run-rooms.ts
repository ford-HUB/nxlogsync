import type { RoomLevel } from '@/types/run-rooms'

/**
 * Pass or fall, after Level Devil: one room per level with a single door out, and blocks to jump
 * between that never quite do what they promised. The stage is the same 1000 × 300 strip as the
 * runner's; y is height above the floor line, which is GROUND_Y.
 */

/** Units per second walking; a jump rises about 116 and carries about 200 across. */
export const ROOM_WALK = 300
export const ROOM_GRAVITY = 2100
export const ROOM_JUMP = 700
export const ROOM_MAX_FALL = 1200
export const ROOM_COYOTE = 0.08
export const ROOM_BUFFER = 0.12
/** The room's side walls' thickness, and its ceiling's height above the floor line. */
export const ROOM_WALL = 10
export const ROOM_CEILING = 252
/** Below this the runner has fallen out of the room. */
export const ROOM_PIT = -90
export const ROOM_DEATH_SECONDS = 0.9
/** Falls a whole run can take, over every room; the last one ends it. */
export const ROOM_ATTEMPTS = 5
export const ROOM_CLEAR_SECONDS = 1.4
/** Levels per chapter; each chapter's rooms stack more traps, faster, than the last's. */
export const ROOM_CHAPTER_SIZE = 4
/** A room is worth this, less a cost per fall in it, never under the floor. */
export const ROOM_POINTS = { clear: 1000, perDeath: 100, min: 200 } as const

/** A floor slab, its top on the floor line. */
const floor = (id: string, x: number, w: number) => ({ id, kind: 'floor' as const, x, y: -48, w, h: 48 })
/** A floating block whose top is at `top`. */
const block = (id: string, x: number, top: number, w: number) => ({ id, kind: 'block' as const, x, y: top - 24, w, h: 24 })
/** Rocks hidden under the floor, until a trap pushes them up by ROCKS_UP. */
const rocks = (id: string, x: number, w: number, base = 0) => ({ id, kind: 'rocks' as const, x, y: base - 30, w, h: 30 })
const ROCKS_UP = { x: 0, y: 30 }
const door = (x: number, y = 0) => ({ id: 'door', kind: 'door' as const, x, y, w: 46, h: 78 })
/** Looks just like the door; goes nowhere. */
const decoy = (x: number, y = 0) => ({ id: 'decoy', kind: 'decoy' as const, x, y, w: 46, h: 78 })
/** Far out of sight below the room, until a trap raises it by HIDDEN_RISE to stand at `top`. */
const HIDDEN_DROP = 300
const hiddenBlock = (id: string, x: number, top: number, w: number) => block(id, x, top - HIDDEN_DROP, w)
const HIDDEN_RISE = { x: 0, y: HIDDEN_DROP }

export const ROOM_LEVELS: RoomLevel[] = [
  // Chapter 1 (1–4): one trap per room, so each trick is learned on its own.
  {
    // The middle block runs off as soon as the runner leaves the floor; it comes back a moment later.
    name: 'Easy, right?',
    start: 60,
    pieces: [floor('a', 0, 330), block('b', 430, 20, 120), floor('c', 740, 260), door(900)],
    traps: [
      {
        id: 'b-runs',
        pieces: ['b'],
        when: { from: 290, to: 440, airborne: true },
        steps: [
          { to: { x: 150, y: 0 }, seconds: 0.22 },
          { to: { x: 0, y: 0 }, seconds: 0.5, wait: 1.1 },
        ],
      },
    ],
  },
  {
    // The high block shakes and drops under the runner; rocks come up where it lands next.
    name: "Don't stand still",
    start: 60,
    pieces: [floor('a', 0, 260), block('b1', 340, 30, 100), block('b2', 520, 60, 100), rocks('r', 770, 80), floor('c', 700, 300), door(900)],
    traps: [
      { id: 'b2-drops', pieces: ['b2'], when: { standingOn: 'b2' }, steps: [{ to: { x: 0, y: -400 }, seconds: 0.6, wait: 0.3 }] },
      { id: 'rocks-up', pieces: ['r'], when: { from: 705 }, steps: [{ to: ROCKS_UP, seconds: 0.08, wait: 0.05 }] },
    ],
  },
  {
    // The door runs back to the start; on the way back, the floor before the gap gives way.
    name: 'Come back here',
    start: 60,
    pieces: [floor('a1', 0, 240), floor('a2', 240, 180), floor('c', 560, 440), door(900)],
    traps: [
      { id: 'door-runs', pieces: ['door'], when: { from: 820 }, steps: [{ to: { x: -860, y: 0 }, seconds: 0.45 }] },
      {
        id: 'floor-gives',
        pieces: ['a2'],
        when: { standingOn: 'a2', after: 'door-runs' },
        steps: [{ to: { x: 0, y: -400 }, seconds: 0.5, wait: 0.3 }],
      },
    ],
  },
  {
    // Ride the swinging block over the pit; the crusher drops on whoever runs straight for the door.
    name: 'Mind your head',
    start: 60,
    pieces: [
      floor('a', 0, 200),
      { ...block('b', 240, 30, 110), swing: { x: 420, y: 0, seconds: 3.2 } },
      floor('c', 800, 200),
      { id: 'k', kind: 'crusher', x: 820, y: 110, w: 52, h: 142 },
      door(920),
    ],
    traps: [
      {
        id: 'crush',
        pieces: ['k'],
        when: { from: 770 },
        steps: [
          { to: { x: 0, y: -110 }, seconds: 0.12, wait: 0.12 },
          { to: { x: 0, y: 0 }, seconds: 0.7, wait: 0.6 },
        ],
      },
    ],
  },
  // Chapter 2 (5–8): the traps come in pairs, and the room itself starts lying (fake doors, flipped controls).
  {
    // Up the steps to the ledge: the floor turns to rocks behind you and the top step sinks (and comes back).
    name: 'Going down?',
    start: 60,
    pieces: [
      rocks('r', 200, 560),
      floor('a', 0, 1000),
      block('s1', 260, 45, 90),
      block('s2', 460, 85, 90),
      block('s3', 640, 125, 90),
      // Too tall to jump onto from the floor, so the steps are the only way up.
      { id: 'ledge', kind: 'block', x: 780, y: 0, w: 220, h: 130 },
      door(920, 130),
    ],
    traps: [
      { id: 'rocks-up', pieces: ['r'], when: { standingOn: 's1' }, steps: [{ to: ROCKS_UP, seconds: 0.1, wait: 0.2 }] },
      {
        id: 'elevator',
        pieces: ['s3'],
        when: { standingOn: 's3' },
        steps: [
          { to: { x: 0, y: -85 }, seconds: 0.35, wait: 0.15 },
          { to: { x: 0, y: 0 }, seconds: 0.6, wait: 0.5 },
        ],
      },
    ],
  },
  {
    // Three blocks, three different lies, and the door hops up out of reach for a moment.
    name: 'Hop, sink, hop',
    start: 60,
    pieces: [
      floor('a', 0, 180),
      block('b1', 260, 20, 80),
      { ...block('b2', 420, 60, 80), swing: { x: 0, y: 60, seconds: 2.4 } },
      block('b3', 580, 40, 80),
      rocks('r', 790, 70),
      floor('c', 740, 260),
      door(910),
    ],
    traps: [
      { id: 'b1-drops', pieces: ['b1'], when: { standingOn: 'b1' }, steps: [{ to: { x: 0, y: -400 }, seconds: 0.5, wait: 0.2 }] },
      { id: 'b3-sinks', pieces: ['b3'], when: { from: 500, to: 600, airborne: true }, steps: [{ to: { x: 0, y: -60 }, seconds: 0.15 }] },
      { id: 'rocks-up', pieces: ['r'], when: { from: 745 }, steps: [{ to: ROCKS_UP, seconds: 0.08, wait: 0.25 }] },
      {
        id: 'door-hops',
        pieces: ['door'],
        when: { from: 870 },
        steps: [
          { to: { x: 0, y: 140 }, seconds: 0.2 },
          { to: { x: 0, y: 0 }, seconds: 0.3, wait: 1.2 },
        ],
      },
    ],
  },
  {
    // Mid-jump over the pit, left and right swap. Let go and you fall back onto rocks.
    name: 'Left is right',
    start: 60,
    pieces: [rocks('r1', 250, 90), floor('a', 0, 340), rocks('r2', 640, 80), floor('c', 520, 480), door(900)],
    traps: [
      { id: 'flip', pieces: [], when: { from: 420, to: 520, airborne: true }, steps: [], flip: true },
      { id: 'edge-rocks', pieces: ['r1'], when: { after: 'flip' }, steps: [{ to: ROCKS_UP, seconds: 0.08 }] },
      { id: 'rocks-up', pieces: ['r2'], when: { from: 580 }, steps: [{ to: ROCKS_UP, seconds: 0.08, wait: 0.2 }] },
    ],
  },
  {
    // That door is a decoy: it sinks, the floor under it goes, and the real one drops in behind you.
    name: 'Not that door',
    start: 60,
    pieces: [
      decoy(880),
      floor('a2', 760, 240),
      rocks('r', 540, 80),
      floor('a1', 0, 760),
      { ...door(450), y: 300 },
    ],
    traps: [
      { id: 'decoy-sinks', pieces: ['decoy'], when: { from: 800 }, steps: [{ to: { x: 0, y: -100 }, seconds: 0.3 }] },
      { id: 'floor-goes', pieces: ['a2'], when: { from: 800 }, steps: [{ to: { x: 0, y: -400 }, seconds: 0.5, wait: 0.25 }] },
      { id: 'door-drops', pieces: ['door'], when: { after: 'decoy-sinks' }, steps: [{ to: { x: 0, y: -300 }, seconds: 0.35, wait: 0.8 }] },
      { id: 'rocks-up', pieces: ['r'], when: { to: 700, after: 'decoy-sinks' }, steps: [{ to: ROCKS_UP, seconds: 0.08, wait: 0.3 }] },
    ],
  },
  // Chapter 3 (9–12): every trick at once, and less time to think.
  {
    // A pit too wide to cross, until the blocks rise out of it, each only once you trust the last.
    name: 'Leap of faith',
    start: 60,
    pieces: [
      floor('a', 0, 180),
      hiddenBlock('b1', 260, 0, 100),
      hiddenBlock('b2', 440, 30, 100),
      hiddenBlock('b3', 620, 20, 100),
      floor('c', 820, 180),
      door(920),
    ],
    traps: [
      { id: 'b1-rises', pieces: ['b1'], when: { from: 120 }, steps: [{ to: HIDDEN_RISE, seconds: 0.4 }] },
      { id: 'b2-rises', pieces: ['b2'], when: { standingOn: 'b1' }, steps: [{ to: HIDDEN_RISE, seconds: 0.3, wait: 0.2 }] },
      { id: 'b2-drops', pieces: ['b2'], when: { standingOn: 'b2' }, steps: [{ to: { x: 0, y: -400 }, seconds: 0.5, wait: 0.9 }] },
      { id: 'b3-rises', pieces: ['b3'], when: { standingOn: 'b2' }, steps: [{ to: HIDDEN_RISE, seconds: 0.25, wait: 0.35 }] },
      { id: 'b3-sinks', pieces: ['b3'], when: { from: 560, airborne: true, after: 'b3-rises' }, steps: [{ to: { x: 0, y: -40 }, seconds: 0.15 }] },
    ],
  },
  {
    // Two swinging blocks, controls flipped on the second, and the crusher waiting where you land.
    name: 'Everything moves',
    start: 60,
    pieces: [
      floor('a', 0, 160),
      { ...block('b1', 220, 20, 100), swing: { x: 180, y: 0, seconds: 2.6 } },
      { ...block('b2', 560, 40, 100), swing: { x: 0, y: 80, seconds: 2 } },
      floor('c', 840, 160),
      { id: 'k', kind: 'crusher', x: 860, y: 110, w: 52, h: 142 },
      door(940),
    ],
    traps: [
      { id: 'flip', pieces: [], when: { standingOn: 'b2' }, steps: [], flip: true },
      {
        id: 'crush',
        pieces: ['k'],
        when: { from: 820 },
        steps: [
          { to: { x: 0, y: -110 }, seconds: 0.12, wait: 0.1 },
          { to: { x: 0, y: 0 }, seconds: 0.6, wait: 0.5 },
        ],
      },
    ],
  },
  {
    // The floor turns to rocks in waves behind you; the blocks overhead are the only dry land, and one sinks.
    name: 'The floor is rocks',
    start: 60,
    pieces: [
      rocks('r1', 120, 240),
      rocks('r2', 360, 260),
      rocks('r3', 620, 260),
      floor('a', 0, 1000),
      // Kept low: from any higher, the ceiling cuts the jump short of the next block.
      block('b1', 200, 40, 80),
      block('b2', 420, 40, 80),
      block('b3', 660, 40, 80),
      door(930),
    ],
    traps: [
      { id: 'wave-1', pieces: ['r1'], when: { from: 100 }, steps: [{ to: ROCKS_UP, seconds: 0.08, wait: 0.6 }] },
      { id: 'wave-2', pieces: ['r2'], when: { from: 340 }, steps: [{ to: ROCKS_UP, seconds: 0.08, wait: 0.4 }] },
      { id: 'wave-3', pieces: ['r3'], when: { from: 600 }, steps: [{ to: ROCKS_UP, seconds: 0.08, wait: 0.3 }] },
      { id: 'b2-drops', pieces: ['b2'], when: { standingOn: 'b2' }, steps: [{ to: { x: 0, y: -400 }, seconds: 0.5, wait: 0.4 }] },
    ],
  },
  {
    // The real last door: a decoy at the start, a block from nowhere, a flip mid-air, a crusher, and a door that won't sit still.
    name: 'The last door',
    start: 60,
    pieces: [
      decoy(230),
      floor('a2', 150, 150),
      floor('a1', 0, 150),
      hiddenBlock('b1', 380, 30, 90),
      { ...block('b2', 540, 50, 90), swing: { x: 120, y: 0, seconds: 1.8 } },
      floor('c', 800, 200),
      { id: 'k', kind: 'crusher', x: 840, y: 110, w: 52, h: 142 },
      door(930),
    ],
    traps: [
      { id: 'decoy-sinks', pieces: ['decoy'], when: { from: 170 }, steps: [{ to: { x: 0, y: -100 }, seconds: 0.3 }] },
      { id: 'floor-goes', pieces: ['a2'], when: { after: 'decoy-sinks' }, steps: [{ to: { x: 0, y: -400 }, seconds: 0.5, wait: 0.35 }] },
      { id: 'b1-rises', pieces: ['b1'], when: { after: 'decoy-sinks' }, steps: [{ to: HIDDEN_RISE, seconds: 0.3, wait: 0.2 }] },
      { id: 'flip', pieces: [], when: { from: 480, to: 560, airborne: true }, steps: [], flip: true },
      {
        id: 'crush',
        pieces: ['k'],
        when: { from: 790 },
        steps: [
          { to: { x: 0, y: -110 }, seconds: 0.12, wait: 0.08 },
          { to: { x: 0, y: 0 }, seconds: 0.6, wait: 0.4 },
        ],
      },
      {
        id: 'door-hops',
        pieces: ['door'],
        when: { from: 880 },
        steps: [
          { to: { x: 0, y: 140 }, seconds: 0.2 },
          { to: { x: 0, y: 0 }, seconds: 0.3, wait: 1 },
        ],
      },
    ],
  },
]
