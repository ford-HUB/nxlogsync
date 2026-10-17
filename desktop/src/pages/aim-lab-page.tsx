import { motion } from 'motion/react'
import { AimLabGame } from '@/components/aim-lab/aim-lab-game'
import { PlayerNameDialog } from '@/components/typing-test/ui/player-name-dialog'
import { useTypingPlayer } from '@/hooks/use-typing-leaderboard'
import { cn } from '@/lib/utils'
import { useSiteSessionStore } from '@/store/site-session-store'

interface AimLabPageProps {
  onBack: () => void
}

/**
 * The aim trainer as a full-window overlay. Like Tetris, the first visit asks for a leaderboard name, the
 * same one the typing test uses, before the game loads.
 */
export function AimLabPage({ onBack }: AimLabPageProps) {
  const { playerName, playerStatus, savePlayer } = useTypingPlayer()
  // The name lives on the account; without one there is nowhere to save it, so they just play.
  const connected = useSiteSessionStore((s) => s.target.userId !== null)
  // Wait for the server's answer before asking; if it can't be reached, let them play anyway.
  const needsName = connected && playerStatus === 'ready' && !playerName
  const paused = needsName || (connected && (playerStatus === 'idle' || playerStatus === 'loading'))

  return (
    <motion.main
      role="dialog"
      aria-modal="true"
      aria-label="PewPew"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="fixed inset-0 z-50 overflow-hidden bg-black"
    >
      <div className={cn('transition-[filter] duration-300', needsName && 'pointer-events-none blur-md select-none')}>
        <AimLabGame onBack={onBack} playerName={playerName ?? ''} paused={paused} />
      </div>
      {needsName && <PlayerNameDialog open onSave={savePlayer} onCancel={onBack} submitLabel="Let's play" />}
    </motion.main>
  )
}
