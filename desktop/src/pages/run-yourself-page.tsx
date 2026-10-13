import { motion } from 'motion/react'
import { RunGame } from '@/components/run-yourself/run-game'
import { PlayerNameDialog } from '@/components/typing-test/ui/player-name-dialog'
import { useTypingPlayer } from '@/hooks/use-typing-leaderboard'
import { cn } from '@/lib/utils'
import { useSiteSessionStore } from '@/store/site-session-store'

interface RunYourselfPageProps {
  onBack: () => void
}

/**
 * Run yourself as a full-window overlay; the daily log stays visible, blurred, behind it. Like
 * Tetris, the first visit asks for a leaderboard name, the same one the typing test and Tetris
 * use, so a name picked in any of them heads every board.
 */
export function RunYourselfPage({ onBack }: RunYourselfPageProps) {
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
      aria-label="Run yourself"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="fixed inset-0 z-50 overflow-y-auto bg-background/85 backdrop-blur-xl"
    >
      {/* Until a leaderboard name is picked, the game sits blurred and paused behind the prompt. */}
      <div className={cn('transition-[filter] duration-300', needsName && 'pointer-events-none blur-md select-none')}>
        <RunGame onBack={onBack} paused={paused} />
      </div>
      {needsName && <PlayerNameDialog open onSave={savePlayer} onCancel={onBack} submitLabel="Let's play" />}
    </motion.main>
  )
}
