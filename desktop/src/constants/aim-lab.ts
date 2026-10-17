/**
 * Where the Unity WebGL build sits under public/. Build it from the aimlab-engine repo with the
 * product name "aim-lab" and Compression Format "Disabled" (Electron serves the files from disk,
 * without Content-Encoding headers), then copy its Build/ and StreamingAssets/ folders here.
 */
export const AIM_LAB_BUILD_ROOT = `${import.meta.env.BASE_URL}aim-lab`
export const AIM_LAB_BUILD_NAME = 'aim-lab'

/** The game canvas needs an id: Unity finds it by `#id` to listen for keys. */
export const AIM_LAB_CANVAS_ID = 'aim-lab-canvas'

/** Thrown when the build's loader script isn't there. */
export const AIM_LAB_MISSING = 'The PewPew build is missing.'

/** The window events the build dispatches (aim-lab-bridge.jslib): a finished round, and the round's state. */
export const AIM_LAB_SCORE_EVENT = 'aim-lab:score'
export const AIM_LAB_STATE_EVENT = 'aim-lab:state'

/** The Unity object the page sends commands to (StartRound, QuitRound, SetSensitivity). */
export const AIM_LAB_UNITY_OBJECT = 'Training session'

/**
 * Gridshot's round lengths, each with its own leaderboard. The setup keys must match the server's
 * AIM_LAB_SETUPS and the build's TrainingSession ("dot-gridshot-" + seconds).
 */
export const AIM_LAB_SETUPS = [
  { seconds: 15, setup: 'dot-gridshot-15' },
  { seconds: 30, setup: 'dot-gridshot-30' },
  { seconds: 60, setup: 'dot-gridshot-60' },
] as const
export const AIM_LAB_DEFAULT_SECONDS = 60
export const AIM_LAB_SECONDS_KEY = 'nxlogsync-aim-lab-seconds'
/** Dots on the grid at once; the build's TrainingSession.ActiveDots. */
export const AIM_LAB_ACTIVE_TARGETS = 3

/**
 * Mouse sensitivity on Valorant's scale (1 = 0.07° of turn per mouse count), so a player's Valorant
 * value feels the same here. Saved on the account (the server's AIM_LAB_SENSITIVITY has the same
 * range) and cached per computer for signed-out play.
 */
export const AIM_LAB_SENSITIVITY = { min: 0.01, max: 5, step: 0.001, default: 1 } as const
export const AIM_LAB_SENSITIVITY_KEY = 'nxlogsync-aim-lab-sensitivity-valorant'
/** A slider drag settles for this long before the value is sent to the account. */
export const AIM_LAB_SENSITIVITY_SAVE_DELAY_MS = 600

/** How often the FPS readout updates, and the frame rates it colours as smooth or struggling. */
export const AIM_LAB_FPS_SAMPLE_MS = 500
export const AIM_LAB_FPS_GOOD = 100
export const AIM_LAB_FPS_LOW = 45

/**
 * Renders the canvas at CSS pixels rather than the screen's device pixels: on a scaled laptop
 * screen that is half the pixels or less, and the targets still look sharp.
 */
export const AIM_LAB_DEVICE_PIXEL_RATIO = 1

export const AIM_LAB_LEADERBOARD_SIZE = 100
