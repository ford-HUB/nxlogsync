import type { ApiResult } from '@/services/api-client'
import { RELEASES_API_URL, RELEASES_UNREACHABLE_MESSAGE } from '@/constants/releases'
import type { Release } from '@/types/release'

interface GitHubRelease {
  tag_name: string
  name: string | null
  body: string | null
  published_at: string | null
  prerelease: boolean
  draft: boolean
}

/**
 * The published releases from GitHub. Plain fetch rather than the API client, so the
 * NXLogSync session token is never sent to GitHub.
 */
export async function fetchReleases(): Promise<ApiResult<Release[]>> {
  try {
    const res = await fetch(RELEASES_API_URL, { headers: { Accept: 'application/vnd.github+json' } })
    if (!res.ok) return { success: false, message: RELEASES_UNREACHABLE_MESSAGE }
    const releases = (await res.json()) as GitHubRelease[]
    return {
      success: true,
      data: releases
        .filter((r) => !r.draft && r.published_at)
        .map((r) => ({
          version: r.tag_name.replace(/^v/, ''),
          name: r.name ?? '',
          body: r.body ?? '',
          publishedAt: r.published_at as string,
          prerelease: r.prerelease,
        })),
    }
  } catch {
    return { success: false, message: RELEASES_UNREACHABLE_MESSAGE }
  }
}
