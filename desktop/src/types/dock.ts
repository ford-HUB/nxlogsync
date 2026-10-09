export type DockSide = 'top' | 'right' | 'bottom' | 'left'

/** Which window edge a docked widget sits on, and where along it (0–1, 0.5 = the middle). */
export interface EdgeDock {
  side: DockSide
  t: number
}
