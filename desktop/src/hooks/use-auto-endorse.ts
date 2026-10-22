import { useEffect, useState } from 'react'
import { getAutoEndorse, saveAutoEndorse } from '@/services/sync-service'
import type { AutoEndorseSetting } from '@/types/sync-schedule'

const OFF: AutoEndorseSetting = { enabled: false, dayOfMonth: null }

/**
 * The Endorse days dialog's auto-endorse switch: the saved setting, read on
 * every opening, and an edited copy that Save sends to the server.
 */
export function useAutoEndorse(open: boolean) {
  const [saved, setSaved] = useState<AutoEndorseSetting>(OFF)
  const [draft, setDraft] = useState<AutoEndorseSetting>(OFF)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    let cancelled = false
    setLoading(true)
    setError(null)
    void getAutoEndorse().then((result) => {
      if (cancelled) return
      setLoading(false)
      if (result.success) {
        setSaved(result.data)
        setDraft(result.data)
      } else {
        setError(result.message)
      }
    })
    return () => {
      cancelled = true
    }
  }, [open])

  const dirty = draft.enabled !== saved.enabled || (draft.enabled && draft.dayOfMonth !== saved.dayOfMonth)

  /** Saving it off forgets the picked day, so turning it back on starts fresh. Resolves true once saved. */
  const save = async (): Promise<boolean> => {
    const next = draft.enabled ? draft : OFF
    setSaving(true)
    setError(null)
    const result = await saveAutoEndorse(next)
    setSaving(false)
    if (!result.success) {
      setError(result.message)
      return false
    }
    setSaved(result.data)
    setDraft(result.data)
    return true
  }

  return {
    saved,
    draft,
    dirty,
    loading,
    saving,
    error,
    setEnabled: (enabled: boolean) => setDraft((d) => ({ ...d, enabled })),
    setDayOfMonth: (dayOfMonth: number) => setDraft((d) => ({ ...d, dayOfMonth })),
    save,
  }
}
