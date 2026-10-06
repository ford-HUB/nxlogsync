import type { MouseEvent } from 'react'
import { flushSync } from 'react-dom'
import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useThemeStore } from '@/store/theme-store'

const REVEAL_MS = 700
// Fast start, soft settle: reads like water spreading out from where the drop lands.
const REVEAL_EASING = 'cubic-bezier(0.22, 1, 0.36, 1)'

/** A ring that ripples outward from the drop point, on top of the reveal. */
function splashRipple(x: number, y: number) {
  const ring = document.createElement('span')
  ring.className = 'theme-ripple'
  ring.style.left = `${x}px`
  ring.style.top = `${y}px`
  document.body.appendChild(ring)
  ring
    .animate(
      [
        { transform: 'translate(-50%, -50%) scale(0)', opacity: 0.6 },
        { transform: 'translate(-50%, -50%) scale(1)', opacity: 0 },
      ],
      { duration: REVEAL_MS + 200, easing: 'ease-out' },
    )
    .finished.finally(() => ring.remove())
}

export function ThemeToggle() {
  const theme = useThemeStore((s) => s.theme)
  const setTheme = useThemeStore((s) => s.setTheme)
  const next = theme === 'dark' ? 'light' : 'dark'

  const toggle = (event: MouseEvent<HTMLButtonElement>) => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!document.startViewTransition || reduceMotion) {
      setTheme(next)
      return
    }

    // Drop lands at the pointer (or the button's centre for keyboard presses).
    const rect = event.currentTarget.getBoundingClientRect()
    const x = event.clientX || rect.left + rect.width / 2
    const y = event.clientY || rect.top + rect.height / 2
    const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y))

    const transition = document.startViewTransition(() => {
      flushSync(() => setTheme(next))
    })

    transition.ready.then(() => {
      splashRipple(x, y)
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${radius * 0.06}px at ${x}px ${y}px)`,
            `circle(${radius}px at ${x}px ${y}px)`,
          ],
          offset: [0, 0.12, 1],
        },
        { duration: REVEAL_MS, easing: REVEAL_EASING, pseudoElement: '::view-transition-new(root)' },
      )
    })
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button type="button" variant="outline" size="icon" aria-label={`Switch to ${next} mode`} onClick={toggle}>
          {theme === 'dark' ? <Sun /> : <Moon />}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</TooltipContent>
    </Tooltip>
  )
}
