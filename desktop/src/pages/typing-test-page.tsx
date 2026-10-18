import { RotateCcw, WifiOff } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { DuelLobby } from '@/components/typing-test/duel-lobby'
import { ModeSelect } from '@/components/typing-test/mode-select'
import { TypingDuel } from '@/components/typing-test/typing-duel'
import { TypingTest } from '@/components/typing-test/typing-test'
import { ConnectRequiredDialog } from '@/components/typing-test/ui/connect-required-dialog'
import { PlayerNameDialog } from '@/components/typing-test/ui/player-name-dialog'
import { cn } from '@/lib/utils'
import { useSiteSessionStore } from '@/store/site-session-store'
import { useTypingDuelStore } from '@/store/typing-duel-store'
import { useTypingPlayer } from '@/hooks/use-typing-leaderboard'

type TypingMode = 'select' | 'solo' | 'duel'

interface TypingTestPageProps {
  onBack: () => void
  onOpenSettings: () => void
}

/**
 * The typing test as a full-window overlay; the daily log stays visible, blurred, behind it. The
 * first visit asks for the name the leaderboard shows. It opens on a choice between solo and a
 * 1v1; while the user is in a 1v1 (e.g. an invite accepted elsewhere), the race shows instead.
 */
export function TypingTestPage({ onBack, onOpenSettings }: TypingTestPageProps) {
  const { playerName, playerStatus, savePlayer, retry } = useTypingPlayer()
  // Scores live on the account, so a test without one would leave orphan records behind.
  const connected = useSiteSessionStore((s) => s.target.userId !== null)
  // Wait for the server's answer before asking; if it can't be reached, let them type anyway.
  const needsName = connected && playerStatus === 'ready' && !playerName
  const blocked = !connected || needsName
  const paused = blocked || playerStatus === 'idle' || playerStatus === 'loading'

  const [mode, setMode] = useState<TypingMode>('select')
  const match = useTypingDuelStore((s) => s.match)
  const duelLive = useTypingDuelStore((s) => s.live)
  const onlineCount = useTypingDuelStore((s) => s.players.length)
  // After a 1v1 ends, the lobby is where to find the next one.
  const inMatch = match !== null
  useEffect(() => {
    if (inMatch) setMode('duel')
  }, [inMatch])

  return (
    <motion.main
      role="dialog"
      aria-modal="true"
      aria-label="Typing test"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="fixed inset-0 z-50 overflow-y-auto bg-background/85 backdrop-blur-xl"
    >
      {/* Until a leaderboard name is picked, the test sits blurred and paused behind the prompt. */}
      <div className={cn('transition-[filter] duration-300', blocked && 'pointer-events-none blur-md select-none')}>
        {match ? (
          <TypingDuel match={match} paused={paused} />
        ) : mode === 'solo' ? (
          <TypingTest onBack={() => setMode('select')} paused={paused} />
        ) : mode === 'duel' ? (
          <DuelLobby onBack={() => setMode('select')} paused={paused} />
        ) : (
          <ModeSelect
            onSolo={() => setMode('solo')}
            onDuel={() => setMode('duel')}
            onClose={onBack}
            onlineCount={onlineCount}
            live={duelLive}
            paused={paused}
          />
        )}
      </div>
      {!connected && <ConnectRequiredDialog open onOpenSettings={onOpenSettings} onCancel={onBack} />}
      {needsName && <PlayerNameDialog open onSave={savePlayer} onCancel={onBack} />}

      {/* The server couldn't be reached: the test still works, but nothing is saved. */}
      <AnimatePresence>
        {connected && playerStatus === 'error' && (
          <motion.div
            role="status"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="fixed bottom-14 left-1/2 z-10 flex -translate-x-1/2 items-center gap-3 rounded-full border bg-background/90 py-1.5 pr-1.5 pl-3.5 font-mono text-[12px] text-foreground shadow-sm"
          >
            <WifiOff className="size-3.5 text-destructive" />
            <span>
              Can&apos;t reach the server —{' '}
              <span className="text-muted-foreground">your scores won&apos;t be saved</span>
            </span>
            <button
              type="button"
              onClick={retry}
              className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 hover:bg-muted/70"
            >
              <RotateCcw className="size-3" /> Retry
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.main>
  )
}
