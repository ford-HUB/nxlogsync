import { Flame, Ghost, Hourglass } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { RUNNER_X } from '@/constants/run-yourself'
import type { SkillKind } from '@/types/run-yourself'

/** Each skill's icon, on its pickup and its key. */
export const SKILL_ICONS: Record<SkillKind, LucideIcon> = { fire: Flame, slow: Hourglass, phase: Ghost }

/** Where the runner's fist (or foot) is mid-strike, for the fire fists' flame. */
export const STRIKE_POINT = { punch: { x: RUNNER_X + 46, lift: 52 }, kick: { x: RUNNER_X + 50, lift: 18 } } as const
