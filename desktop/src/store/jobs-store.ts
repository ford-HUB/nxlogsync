import { create } from 'zustand'
import { getJobs } from '@/services/jobs-service'
import type { Job } from '@/types/daily-log'

interface JobsState {
  jobs: Job[]
  costCenters: string[]
  defaultCostCenter: string
  loading: boolean
  initialized: boolean
  error: string | null
  /** Loads the user's Job lookup; `refresh` makes the server read N-PAX again. */
  fetchJobs: (refresh?: boolean) => Promise<void>
  /** Forgets the signed-out user's jobs so the next user never sees them. */
  reset: () => void
}

const initialState = {
  jobs: [],
  costCenters: [],
  defaultCostCenter: '',
  loading: false,
  initialized: false,
  error: null,
}

export const useJobsStore = create<JobsState>((set) => ({
  ...initialState,

  fetchJobs: async (refresh = false) => {
    set({ loading: true, error: null })
    const result = await getJobs(refresh)
    if (result.success) {
      set({ ...result.data, loading: false, initialized: true })
      return
    }
    set({ loading: false, initialized: true, error: result.message })
  },

  reset: () => set(initialState),
}))
