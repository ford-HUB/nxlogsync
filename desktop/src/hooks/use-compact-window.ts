import { useEffect, useState } from 'react'

/** The content column (max-w-6xl) plus a docked widget's lane on each side. */
const DOCKABLE_WIDTH = 1152 + 2 * 144

/**
 * A window too narrow for the margin beside the content column to hold a docked widget: the
 * Trash and the Typing test then sit under the task list instead of on a window edge.
 */
export const isCompactWindow = () => window.innerWidth < DOCKABLE_WIDTH

/** Whether the window is compact right now; updates as it is resized. */
export function useCompactWindow() {
  const [compact, setCompact] = useState(isCompactWindow)
  useEffect(() => {
    const update = () => setCompact(isCompactWindow())
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])
  return compact
}
