import { motion } from 'motion/react'
import { TypingTest } from '@/components/typing-test/typing-test'

interface TypingTestPageProps {
  onBack: () => void
}

/** The typing test as a full-window overlay; the daily log stays visible, blurred, behind it. */
export function TypingTestPage({ onBack }: TypingTestPageProps) {
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
      <TypingTest onBack={onBack} />
    </motion.main>
  )
}
