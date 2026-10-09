import { useEdgeDock } from '@/hooks/use-edge-dock'

/** The bottom of the right edge until the user moves it; other docked widgets step aside for it. */
const TRASH_DOCK = { storageKey: 'nxlogsync-trash-dock', defaultDock: { side: 'right', t: 1 }, priority: 1 } as const

/** Where the Trash sits; pressing it does nothing while a task is being dragged onto it. */
export function useTrashDock(disabled: boolean) {
  return useEdgeDock({ ...TRASH_DOCK, disabled })
}
