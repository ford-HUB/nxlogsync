import { motion } from 'motion/react'
import { RunGame } from '@/components/run-yourself/run-game'

interface RunYourselfPageProps {
  onBack: () => void
}

/** Run yourself as a full-window overlay; the daily log stays visible, blurred, behind it. */
export function RunYourselfPage({ onBack }: RunYourselfPageProps) {
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
      <RunGame onBack={onBack} />
    </motion.main>
  )
}
