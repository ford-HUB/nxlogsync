import { AIM_LAB_BUILD_NAME, AIM_LAB_BUILD_ROOT, AIM_LAB_DEVICE_PIXEL_RATIO, AIM_LAB_MISSING } from '@/constants/aim-lab'
import type { UnityInstance } from '@/types/aim-lab'

let loaderScript: Promise<void> | null = null
let lastQuit: Promise<void> = Promise.resolve()

/** Adds the build's loader script once; it defines window.createUnityInstance. */
function loadLoaderScript(): Promise<void> {
  if (window.createUnityInstance) return Promise.resolve()
  loaderScript ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = `${AIM_LAB_BUILD_ROOT}/Build/${AIM_LAB_BUILD_NAME}.loader.js`
    script.onload = () => resolve()
    script.onerror = () => {
      script.remove()
      loaderScript = null
      reject(new Error(AIM_LAB_MISSING))
    }
    document.body.appendChild(script)
  })
  return loaderScript
}

/**
 * Makes the canvas's mouse lock ask for raw input, as Valorant reads the mouse: movement in the sensor's
 * own counts, without Windows' pointer speed or "Enhance pointer precision" acceleration. Unity locks
 * the mouse with a plain requestPointerLock(), so this wraps it; where raw input isn't supported the
 * lock falls back to the adjusted movement rather than failing.
 */
function requestRawMouse(canvas: HTMLCanvasElement) {
  const lock = HTMLCanvasElement.prototype.requestPointerLock
  const request = (options?: PointerLockOptions) => new Promise<void>((resolve) => resolve(lock.call(canvas, options)))
  canvas.requestPointerLock = () =>
    request({ unadjustedMovement: true })
      .catch((err: unknown) => (err instanceof DOMException && err.name === 'NotSupportedError' ? request() : Promise.reject(err)))
      // Refused (too soon after Esc, or Esc pressed mid-request): stay unlocked; the pause screen covers it
      .catch((err: unknown) => console.warn('Mouse lock refused', err))
}

/** Takes the mouse lock for the game, as raw input; must run inside a click (the Resume button). */
export function lockAimLabPointer(canvas: HTMLCanvasElement) {
  void canvas.requestPointerLock()
}

/** Unity alerts on any uncaught error; a refused mouse lock is expected (Esc mid-request), so only log it. */
function isPointerLockError(message: string) {
  return /pointer ?lock|exited the lock/i.test(message)
}

let textFieldsGuarded = false

/**
 * Keeps page text fields (the sensitivity box) typeable while the game runs. Unity 6 listens for keys
 * on the whole window and cancels every keydown (its build ignores keyboardListeningElement), which
 * swallows typing. This window capture listener is added before Unity's, so it runs first and makes
 * cancelling a no-op for keys aimed at a text field; the game reads no keys, so it loses nothing.
 */
function guardTextFields() {
  if (textFieldsGuarded) return
  textFieldsGuarded = true
  const allowTyping = (e: KeyboardEvent) => {
    const target = e.target
    // Tab and Esc stay cancellable: the trainer's own shortcuts use them
    if (e.key === 'Tab' || e.key === 'Escape') return
    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) e.preventDefault = () => undefined
  }
  for (const type of ['keydown', 'keypress', 'keyup'] as const) window.addEventListener(type, allowTyping, true)
}

/** Starts the Unity WebGL build on the canvas. `onProgress` reports 0–1 while the build downloads. */
export async function startAimLab(canvas: HTMLCanvasElement, onProgress: (progress: number) => void): Promise<UnityInstance> {
  requestRawMouse(canvas)
  guardTextFields()
  // A quit still finishing (the page was closed and reopened quickly) must not overlap the new start.
  await lastQuit
  await loadLoaderScript()
  if (!window.createUnityInstance) throw new Error(AIM_LAB_MISSING)
  const build = `${AIM_LAB_BUILD_ROOT}/Build/${AIM_LAB_BUILD_NAME}`
  const instance = await window.createUnityInstance(
    canvas,
    {
      dataUrl: `${build}.data`,
      frameworkUrl: `${build}.framework.js`,
      codeUrl: `${build}.wasm`,
      streamingAssetsUrl: `${AIM_LAB_BUILD_ROOT}/StreamingAssets`,
      companyName: 'DE4RD',
      productName: AIM_LAB_BUILD_NAME,
      productVersion: __APP_VERSION__,
      devicePixelRatio: AIM_LAB_DEVICE_PIXEL_RATIO,
      errorHandler: (message) => {
        if (!isPointerLockError(message)) return false
        console.warn('Aim trainer:', message)
        return true
      },
    },
    onProgress,
  )
  return {
    SendMessage: (objectName, methodName, value) => instance.SendMessage(objectName, methodName, value),
    Quit: () => (lastQuit = instance.Quit().catch(() => undefined)),
  }
}
