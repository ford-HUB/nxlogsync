import { useCallback, useEffect, useState } from 'react'
import { fetchReleases } from '@/services/release-service'
import type { Release } from '@/types/release'

/** The release notes from GitHub, fetched each time the page opens. */
export function useReleases() {
  const [releases, setReleases] = useState<Release[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const result = await fetchReleases()
    if (result.success) setReleases(result.data)
    else setError(result.message)
    setLoading(false)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return { releases, loading, error, retry: () => void load() }
}
