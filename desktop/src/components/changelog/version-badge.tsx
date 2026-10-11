interface VersionBadgeProps {
  onOpen: () => void
}

/** The installed version, pinned to the window's bottom-right corner; clicking it opens the release notes. */
export function VersionBadge({ onOpen }: VersionBadgeProps) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`Version ${__APP_VERSION__} — see what's new`}
      className="fixed right-3 bottom-2 z-30 rounded-md px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground/70 transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
    >
      v{__APP_VERSION__}
    </button>
  )
}
