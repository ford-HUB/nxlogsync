import { Lock } from 'lucide-react'

/** Shown on an endorsed day: N-PAX has sent it to the checker, so its entries are read-only. */
export function EndorsedNotice() {
  return (
    <div
      role="status"
      className="flex items-center gap-3 rounded-xl bg-background px-4 py-2.5 text-[13px] shadow-sm ring-1 ring-border"
    >
      <Lock className="size-4 shrink-0 text-muted-foreground" />
      <span className="min-w-0 flex-1">
        This day is endorsed on N-PAX. Its entries can no longer be added, edited, moved or deleted.
      </span>
    </div>
  )
}
