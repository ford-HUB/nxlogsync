import { AnimatePresence, motion } from 'motion/react'
import { useEffect } from 'react'
import logo from '@/assets/logo-nxlogsync.png'
import { Button } from '@/components/ui/button'
import { useAppUpdate } from '@/hooks/use-app-update'
import { cn } from '@/lib/utils'

const MB = 1024 * 1024

function megabytes(bytes: number) {
  return (bytes / MB).toFixed(1)
}

/**
 * Covers the whole app while a new version downloads and installs, instead of the window just
 * closing: the progress, then "installing", and the app reopens by itself on the new version. Nothing
 * underneath takes keys meanwhile. A failed update says so and lets the user carry on.
 */
export function UpdateScreen() {
  const { status, dismiss } = useAppUpdate()
  const blocking = status.phase === 'downloading' || status.phase === 'installing'

  // Keys stop here, ahead of the daily log's and the games' shortcuts.
  useEffect(() => {
    if (!blocking) return
    const onKey = (e: KeyboardEvent) => {
      e.stopPropagation()
      e.preventDefault()
    }
    window.addEventListener('keydown', onKey, true)
    window.addEventListener('keyup', onKey, true)
    return () => {
      window.removeEventListener('keydown', onKey, true)
      window.removeEventListener('keyup', onKey, true)
    }
  }, [blocking])

  const percent = status.phase === 'downloading' ? Math.min(100, Math.max(0, status.percent)) : 100

  return (
    <AnimatePresence>
      {status.phase !== 'none' && (
        <motion.div
          key="update"
          role="dialog"
          aria-modal="true"
          aria-labelledby="update-title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-background/95 px-4 font-mono backdrop-blur-sm"
        >
          <div className="flex w-full max-w-sm flex-col items-center gap-6 text-center">
            <img src={logo} alt="" draggable={false} className="size-14 select-none" />
            <div className="flex flex-col gap-1.5">
              <h2 id="update-title" className="text-[1.125rem] font-semibold text-foreground">
                {status.phase === 'error' ? "Couldn't finish the update" : 'Updating NXLogSync'}
              </h2>
              <p className="text-[12px] text-muted-foreground">
                v{__APP_VERSION__}
                {status.version && <> → v{status.version}</>}
              </p>
            </div>

            {blocking && (
              <div className="flex w-full flex-col gap-2" aria-live="polite">
                <div
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={status.phase === 'downloading' ? Math.round(percent) : undefined}
                  aria-label={status.phase === 'downloading' ? 'Download progress' : 'Installing'}
                  className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted"
                >
                  {status.phase === 'downloading' ? (
                    <div className="h-full rounded-full bg-score transition-[width] duration-300 ease-out" style={{ width: `${percent}%` }} />
                  ) : (
                    // Installing has no progress to report: a bar that sweeps until the app reopens.
                    <motion.div
                      className="absolute inset-y-0 w-1/3 rounded-full bg-score"
                      animate={{ left: ['-33%', '100%'] }}
                      transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
                    />
                  )}
                </div>
                <div className="flex justify-between text-[11px] text-muted-foreground tabular-nums">
                  {status.phase === 'downloading' ? (
                    <>
                      <span>
                        {status.total > 0 ? `${megabytes(status.transferred)} of ${megabytes(status.total)} MB` : 'Starting download…'}
                      </span>
                      <span className={cn(status.total === 0 && 'invisible')}>
                        {Math.floor(percent)}% · {megabytes(status.bytesPerSecond)} MB/s
                      </span>
                    </>
                  ) : (
                    <span className="w-full text-center">Installing…</span>
                  )}
                </div>
              </div>
            )}

            {blocking ? (
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                {status.phase === 'downloading'
                  ? 'Keep NXLogSync open. When the download finishes it installs, and reopens by itself.'
                  : 'NXLogSync will close for a moment while the installer runs, then reopen on the new version.'}
              </p>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  {status.phase === 'error' && status.message}
                  <br />
                  It will try again the next time NXLogSync opens.
                </p>
                <Button type="button" size="sm" onClick={dismiss}>
                  Continue with v{__APP_VERSION__}
                </Button>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
