import type { AIM_LAB_SETUPS } from '@/constants/aim-lab'

/** A training mode, as the Unity build's AimLabBridge names it. */
export type AimLabSetup = (typeof AIM_LAB_SETUPS)[number]['setup']

/** What the Unity build dispatches on `aim-lab:score` when a round ends (aim-lab-bridge.jslib). */
export interface AimLabScoreEvent {
  setup: string
  /** Targets hit. */
  score: number
  /** Hits out of shots fired, 0–100. */
  accuracy: number
  shotsFired: number
  shotsHit: number
}

export interface AimLabLeaderboardEntry {
  id: string
  name: string
  score: number
  accuracy: number
  /** The signed-in user's own row. */
  you: boolean
}

export interface AimLabLeaderboard {
  setup: string
  entries: AimLabLeaderboardEntry[]
  /** The user's best for the mode, on the board or not; null without one. */
  you: { rank: number; score: number; accuracy: number } | null
}

export interface AimLabScoreResult extends AimLabLeaderboard {
  /** The session beat the user's previous best for the mode. */
  personalBest: boolean
}

/** The game while it loads, plays, or fails to load (no WebGL build shipped). */
export type AimLabStatus = 'idle' | 'loading' | 'ready' | 'error'

/**
 * Where the round is: waiting on the start screen, started but waiting for the click that locks the
 * mouse, playing, paused (Esc released the mouse; the clock stops), or showing its results.
 */
export type AimLabPhase = 'ready' | 'armed' | 'running' | 'paused' | 'results'

/** What the Unity build dispatches on `aim-lab:state` as the round changes (aim-lab-bridge.jslib). */
export interface AimLabGameState {
  phase: AimLabPhase
  /** The round's length in seconds. */
  roundSeconds: number
  /** Seconds left in the round. */
  timeLeft: number
  /** Targets hit. */
  score: number
  shotsFired: number
  /** Hits out of shots fired, 0–100. */
  accuracy: number
}

/** The running Unity player, as createUnityInstance resolves it. */
export interface UnityInstance {
  Quit: () => Promise<void>
  SendMessage: (objectName: string, methodName: string, value?: string | number) => void
}

export interface UnityConfig {
  dataUrl: string
  frameworkUrl: string
  codeUrl: string
  streamingAssetsUrl: string
  companyName: string
  productName: string
  productVersion: string
  devicePixelRatio?: number
  /** Called for every uncaught error in the game; returning true skips Unity's alert. */
  errorHandler?: (message: string, filename?: string, line?: number) => boolean
}

declare global {
  interface Window {
    /** Defined by the Unity build's loader script once it has loaded. */
    createUnityInstance?: (
      canvas: HTMLCanvasElement,
      config: UnityConfig,
      onProgress?: (progress: number) => void,
    ) => Promise<UnityInstance>
  }
}
