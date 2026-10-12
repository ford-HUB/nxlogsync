import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { MAX_SKILLS, SKILL_TYPES, SKILLS } from '@/constants/tetris'
import { cn } from '@/lib/utils'
import { SkillArt } from './skill-art'

interface SkillsDialogProps {
  open: boolean
  /** The key that arms a skill, as the player has it bound. */
  skillKey: string
  onClose: () => void
}

/** How a skill is earned and spent, in the order it happens. */
const howItWorks = (skillKey: string) => [
  'Now and then a falling piece carries a coloured skill block.',
  'Clear its row, or blast it with a bomb, to collect the skill.',
  `You can hold up to ${MAX_SKILLS} skills; any more are lost.`,
  `Press ${skillKey.toUpperCase()} to arm your oldest skill on the falling piece. It fires when that piece lands.`,
]

/** Every skill with its colour, icon and power, plus how skills are collected and used. */
export function SkillsDialog({ open, skillKey, onClose }: SkillsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="font-mono">
        <DialogHeader>
          <DialogTitle>Skills</DialogTitle>
          <DialogDescription>Each colour on the board is a skill waiting to be freed.</DialogDescription>
        </DialogHeader>

        <ul className="flex flex-col gap-2">
          {SKILL_TYPES.map((type) => {
            const skill = SKILLS[type]
            return (
              <li key={type} className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                <SkillArt skill={type} className="size-12 shrink-0 drop-shadow-[0_3px_5px_rgba(0,0,0,0.25)]" />
                <span className="flex flex-col gap-0.5">
                  <span className={cn('text-[13px] font-semibold', skill.color.text)}>{skill.name}</span>
                  <span className="text-[12px] text-muted-foreground">{skill.hint}</span>
                </span>
              </li>
            )
          })}
        </ul>

        <div className="flex flex-col gap-2">
          <span className="text-[10px] tracking-[0.18em] text-muted-foreground uppercase">how it works</span>
          <ol className="flex list-decimal flex-col gap-1 pl-5 text-[12px] text-foreground marker:text-muted-foreground">
            {howItWorks(skillKey).map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </div>
      </DialogContent>
    </Dialog>
  )
}
