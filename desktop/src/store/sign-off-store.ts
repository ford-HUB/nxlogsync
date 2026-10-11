import { create } from 'zustand'
import { stampDate } from '@/lib/sign-off-stamps'
import type { ReportKind, SignOff } from '@/types/excel-report'

const STORAGE_KEY = 'nxlogsync-sign-off'

/** The stamps' initials when nothing was saved yet: the supervisor, and who prepares the report. */
const DEFAULT_INITIALS = { supervisor: 'LLJ', preparedBy: 'CDB' }

type Initials = typeof DEFAULT_INITIALS

/** Saved initials per report; FEP and FEM may be signed by different people. */
function readSaved(): Partial<Record<ReportKind, Initials>> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') ?? {}
  } catch {
    return {}
  }
}

interface SignOffState {
  /** "10.11.26": the date created, on all three stamps. Not saved; it starts at today. */
  date: string
  saved: Partial<Record<ReportKind, Initials>>
  initialsFor: (kind: ReportKind) => Initials
  setDate: (date: string) => void
  setInitials: (kind: ReportKind, initials: Partial<Initials>) => void
  /** The stamps' values for a report. */
  signOffFor: (kind: ReportKind) => SignOff
}

export const useSignOffStore = create<SignOffState>((set, get) => ({
  date: stampDate(new Date()),
  saved: readSaved(),
  initialsFor: (kind) => ({ ...DEFAULT_INITIALS, ...get().saved[kind] }),
  setDate: (date) => set({ date }),
  setInitials: (kind, initials) => {
    const saved = { ...get().saved, [kind]: { ...get().initialsFor(kind), ...initials } }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saved))
    } catch {
      // Not persisted; the initials still hold for this session.
    }
    set({ saved })
  },
  signOffFor: (kind) => ({ date: get().date, ...get().initialsFor(kind) }),
}))
