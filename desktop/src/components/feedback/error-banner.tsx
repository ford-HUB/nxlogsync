import { CircleAlert, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ErrorBannerProps {
  message: string
  onRetry?: () => void
  onDismiss?: () => void
}

/** A failed load or save, shown above the screen it affects. */
export function ErrorBanner({ message, onRetry, onDismiss }: ErrorBannerProps) {
  return (
    <div
      role="alert"
      className="flex items-center gap-3 rounded-xl bg-destructive/10 px-4 py-2.5 text-[13px] text-destructive ring-1 ring-destructive/20"
    >
      <CircleAlert className="size-4 shrink-0" />
      <span className="min-w-0 flex-1">{message}</span>
      {onRetry && (
        <Button type="button" variant="ghost" size="sm" onClick={onRetry} className="text-destructive">
          Retry
        </Button>
      )}
      {onDismiss && (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Dismiss"
          onClick={onDismiss}
          className="text-destructive"
        >
          <X />
        </Button>
      )}
    </div>
  )
}
