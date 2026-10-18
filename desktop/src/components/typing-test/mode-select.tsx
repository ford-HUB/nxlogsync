import { Keyboard, Swords } from 'lucide-react'
import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { useTypingKeys } from '@/hooks/use-typing-keys'
import type { LiveStatus } from '@/store/typing-leaderboard-store'
import { LiveBadge } from './ui/leaderboard'

interface ModeSelectProps {
  onSolo: () => void
  onDuel: () => void
  onClose: () => void
  /** Other players online right now, for the 1v1 card. */
  onlineCount: number
  live: LiveStatus
  /** Behind a dialog: not listening for keys. */
  paused?: boolean
}

interface ModeCardProps {
  hotkey: string
  icon: ReactNode
  title: string
  description: string
  footer: ReactNode
  onClick: () => void
  delay: number
}

function ModeCard({ hotkey, icon, title, description, footer, onClick, delay }: ModeCardProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut', delay }}
      whileHover={{ y: -3 }}
      className="group relative flex flex-col gap-5 rounded-xl border bg-muted/30 p-6 text-left outline-none transition-colors hover:border-foreground/30 hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring/50"
    >
      <kbd className="absolute top-4 right-4 rounded-md border bg-muted/60 px-1.5 py-0.5 text-[11px] text-muted-foreground group-hover:text-foreground">
        {hotkey}
      </kbd>
      <span className="flex size-11 items-center justify-center rounded-lg bg-foreground text-background">{icon}</span>
      <span className="flex flex-col gap-1.5">
        <span className="text-xl font-semibold text-foreground">{title}</span>
        <span className="text-[13px] leading-relaxed text-muted-foreground">{description}</span>
      </span>
      <span className="mt-auto flex items-center gap-2 text-[11px] text-muted-foreground">{footer}</span>
    </motion.button>
  )
}

/** The typing test's first screen: practise alone against the top 100, or race someone online. */
export function ModeSelect({ onSolo, onDuel, onClose, onlineCount, live, paused = false }: ModeSelectProps) {
  useTypingKeys({
    onKey: (e) => {
      if (e.key === '1') onSolo()
      if (e.key === '2') onDuel()
    },
    onEscape: onClose,
    paused,
  })

  return (
    <div className="relative mx-auto flex min-h-dvh w-full max-w-3xl flex-col px-4 py-3 font-mono sm:px-8 [@media(min-height:720px)]:py-6">
      <div className="flex flex-1 flex-col justify-center gap-10 py-6">
        <motion.header
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-2 text-center"
        >
          <h1 className="text-2xl font-semibold text-foreground">Typing test</h1>
          <p className="text-[13px] text-muted-foreground">How do you want to play?</p>
        </motion.header>

        <div className="grid gap-4 sm:grid-cols-2">
          <ModeCard
            hotkey="1"
            icon={<Keyboard className="size-5" />}
            title="Solo"
            description="Beat your best and climb the top 100. Pick time or words, punctuation and numbers."
            footer="practice · leaderboard"
            onClick={onSolo}
            delay={0.05}
          />
          <ModeCard
            hotkey="2"
            icon={<Swords className="size-5" />}
            title="1v1"
            description="Invite someone online, agree on a race, and see their flag move as they type. First to finish wins."
            footer={
              <>
                <LiveBadge live={live} />
                <span className="text-foreground tabular-nums">{onlineCount}</span> online
              </>
            }
            onClick={onDuel}
            delay={0.1}
          />
        </div>
      </div>

      <footer className="flex justify-center gap-6 text-[12px] text-muted-foreground">
        <span className="flex items-center gap-2">
          <kbd className="rounded-md border bg-muted/60 px-1.5 py-0.5 text-foreground">1</kbd> solo
        </span>
        <span className="flex items-center gap-2">
          <kbd className="rounded-md border bg-muted/60 px-1.5 py-0.5 text-foreground">2</kbd> 1v1
        </span>
        <span className="flex items-center gap-2">
          <kbd className="rounded-md border bg-muted/60 px-1.5 py-0.5 text-foreground">esc</kbd> close
        </span>
      </footer>
    </div>
  )
}
