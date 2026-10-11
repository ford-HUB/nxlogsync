import { Info } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { MAX_SKILLS, SKILLS } from '@/constants/tetris'
import { cn } from '@/lib/utils'
import type { SkillType } from '@/types/tetris'
import { SkillArt } from './skill-art'

interface SkillSlotsProps {
  skills: SkillType[]
  /** Armed on the falling piece; fires when it lands. */
  armed: SkillType | null
  /** Seconds of Slow left. */
  slowLeft: number
  /** Opens the list of skills and what each does. */
  onShowSkills: () => void
}

/**
 * The skills freed from skill blocks, beside the board under the queue. V arms the top one on the
 * falling piece, and it fires when that piece lands.
 */
export function SkillSlots({ skills, armed, slowLeft, onShowSkills }: SkillSlotsProps) {
  return (
    <div className="flex w-20 flex-col items-center gap-3 font-mono">
      <button
        type="button"
        onClick={onShowSkills}
        // Keep the keyboard on the game, not on the button.
        onMouseDown={(e) => e.preventDefault()}
        title="What each skill does"
        className="flex items-center gap-1 rounded px-1 text-[10px] tracking-[0.18em] text-muted-foreground uppercase underline decoration-dotted underline-offset-4 transition-colors hover:text-foreground"
      >
        skills <Info className="size-3" />
      </button>
      <div className="flex flex-col gap-2">
        {Array.from({ length: MAX_SKILLS }, (_, i) => {
          const skill = skills[i]
          return (
            <div key={i} className="relative size-9 rounded-md bg-muted/45">
              <AnimatePresence mode="popLayout">
                {skill && (
                  <motion.div
                    key={`${skill}-${skills.length}`}
                    initial={{ scale: 0.4, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.4, opacity: 0, y: -6 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 24 }}
                    title={`${SKILLS[skill].name} — ${SKILLS[skill].hint}`}
                    className="size-full"
                  >
                    <SkillArt skill={skill} className="size-full" />
                  </motion.div>
                )}
              </AnimatePresence>
              {i === 0 && skill && !armed && (
                <kbd className="absolute -right-1.5 -bottom-1.5 rounded border bg-background px-1 text-[9px] leading-tight text-foreground">
                  v
                </kbd>
              )}
            </div>
          )
        })}
      </div>
      <div className="flex h-8 flex-col items-center justify-center gap-0.5 text-center text-[10px] leading-tight">
        {armed ? (
          <span className={cn('flex animate-pulse items-center gap-1', SKILLS[armed].color.text)}>
            <SkillArt skill={armed} className="size-3.5" /> armed
          </span>
        ) : (
          slowLeft > 0 && (
            <span className={cn('flex items-center gap-1 tabular-nums', SKILLS.slow.color.text)}>
              <SkillArt skill="slow" className="size-3.5" /> {slowLeft}s
            </span>
          )
        )}
      </div>
    </div>
  )
}
