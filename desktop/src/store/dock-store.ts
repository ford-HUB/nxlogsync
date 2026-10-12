import { create } from 'zustand'
import type { EdgeDock } from '@/types/dock'

/** A docked widget's spot; on a shared edge, the lower priority one steps aside. */
export interface DockedWidget {
  dock: EdgeDock
  priority: number
  /** Extra px kept clear between it and a neighbour on its edge (default 0). */
  gap?: number
}

interface DockState {
  /** Every docked widget (the Trash, the Typing test), keyed by its storage key. */
  widgets: Record<string, DockedWidget>
  place: (key: string, widget: DockedWidget) => void
}

export const useDockStore = create<DockState>((set) => ({
  widgets: {},
  place: (key, widget) => set((s) => ({ widgets: { ...s.widgets, [key]: widget } })),
}))
