import { RotateCcw, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useReleases } from '@/hooks/use-releases'
import { parseReleaseNotes } from '@/lib/release-notes'
import type { Release } from '@/types/release'

interface ChangelogProps {
  onBack: () => void
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })

/** Every published GitHub release, newest first: its version tag, date, and the description written for it. */
export function Changelog({ onBack }: ChangelogProps) {
  const { releases, loading, error, retry } = useReleases()
  const latest = releases?.find((r) => !r.prerelease)?.version

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-6 lg:px-8">
      <header className="flex items-center gap-3">
        <div className="flex min-w-0 flex-1 flex-col">
          <h1 className="text-lg font-semibold">What's new</h1>
          <p className="truncate text-[12px] text-muted-foreground">
            You're on v{__APP_VERSION__}. Updates install automatically when a new version is released.
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Close release notes"
          className="text-muted-foreground"
          onClick={onBack}
        >
          <X />
        </Button>
      </header>

      {loading ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border bg-card p-6 text-center">
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button type="button" variant="outline" size="sm" onClick={retry}>
            <RotateCcw />
            Try again
          </Button>
        </div>
      ) : !releases?.length ? (
        <p className="rounded-xl border bg-card p-6 text-center text-sm text-muted-foreground">
          No releases have been published yet.
        </p>
      ) : (
        <ol className="flex flex-col gap-3">
          {releases.map((release) => (
            <ReleaseCard key={release.version} release={release} latest={release.version === latest} />
          ))}
        </ol>
      )}
    </div>
  )
}

function ReleaseCard({ release, latest }: { release: Release; latest: boolean }) {
  const blocks = parseReleaseNotes(release.body)
  // GitHub fills the title with the tag when none is given; don't repeat the version.
  const title = release.name && release.name.replace(/^v/, '') !== release.version ? release.name : null

  return (
    <li className="rounded-xl border bg-card p-4 shadow-xs">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-sm font-semibold">v{release.version}</span>
        {latest && <Badge>Latest</Badge>}
        {release.prerelease && <Badge variant="secondary">Pre-release</Badge>}
        {release.version === __APP_VERSION__ && <Badge variant="outline">Installed</Badge>}
        <span className="ml-auto text-[12px] text-muted-foreground">{formatDate(release.publishedAt)}</span>
      </div>
      {title && <p className="mt-1 text-sm font-medium">{title}</p>}
      {blocks.length ? (
        <div className="mt-2 flex flex-col gap-1.5 text-sm">
          {blocks.map((block, i) =>
            block.type === 'heading' ? (
              <p key={i} className="mt-1 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                {block.text}
              </p>
            ) : block.type === 'bullet' ? (
              <p key={i} className="flex gap-2">
                <span aria-hidden className="text-muted-foreground">•</span>
                <span>{block.text}</span>
              </p>
            ) : (
              <p key={i} className="text-muted-foreground">
                {block.text}
              </p>
            ),
          )}
        </div>
      ) : (
        <p className="mt-1 text-sm text-muted-foreground">No description for this release.</p>
      )}
    </li>
  )
}
