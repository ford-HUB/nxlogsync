import { useState, type FormEvent } from 'react'
import { AlertCircle, Eye, EyeOff, KeyRound, Loader2, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CONNECTION_DOT, CONNECTION_LABEL } from '@/constants/sync-schedule'
import { cn } from '@/lib/utils'
import type { ConnectionStatus, CredentialsCheck } from '@/types/sync-schedule'

interface CredentialsDialogProps {
  siteName: string
  userId: string | null
  connection: ConnectionStatus
  /** Logs in to the site; on success the dialog switches to its connected view. */
  onConnect: (userId: string, password: string) => Promise<CredentialsCheck>
  /** Ends the server session; resolves to an error message, or null. */
  onLogout: () => Promise<string | null>
}

export function CredentialsDialog({ siteName, userId, connection, onConnect, onLogout }: CredentialsDialogProps) {
  // The server holds a session for this user (it may be mid-reconnect or briefly unreachable).
  const signedIn = userId !== null
  const [open, setOpen] = useState(false)
  const [draftUserId, setDraftUserId] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleOpenChange = (next: boolean) => {
    // Stay open while the site login is in flight so the result has somewhere to land.
    if (verifying) return
    if (next) {
      setDraftUserId(userId ?? '')
      setPassword('')
      setShowPassword(false)
      setError(null)
    }
    setOpen(next)
  }

  const canConnect = draftUserId.trim() !== '' && password !== '' && !verifying

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!canConnect) return
    setVerifying(true)
    setError(null)
    const result = await onConnect(draftUserId.trim(), password)
    setVerifying(false)
    if (result.status !== 'valid') {
      setError(result.message)
      return
    }
    // Stay open: the parent flips `connected`, so the dialog now shows the connected view.
    setPassword('')
  }

  const handleLogout = async () => {
    setVerifying(true)
    setError(null)
    const message = await onLogout()
    setVerifying(false)
    if (message) {
      setError(message)
      return
    }
    setDraftUserId(userId ?? '')
    setPassword('')
    setShowPassword(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          {signedIn ? (
            <span className={cn('size-2 rounded-full', CONNECTION_DOT[connection])} aria-hidden />
          ) : (
            <KeyRound />
          )}
          {signedIn ? CONNECTION_LABEL[connection] : 'Connect'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        {signedIn ? (
          <div className="flex flex-col gap-4">
            <DialogHeader>
              <DialogTitle>Site credentials</DialogTitle>
              <DialogDescription>NXLogSync is signed in to {siteName}.</DialogDescription>
            </DialogHeader>

            <div className="flex items-center gap-3 rounded-lg border px-3 py-2.5">
              <span className={cn('size-2 shrink-0 rounded-full', CONNECTION_DOT[connection])} aria-hidden />
              <div className="flex min-w-0 flex-col">
                <span className="text-[13px] font-medium">{CONNECTION_LABEL[connection]}</span>
                <span className="truncate text-[12px] text-muted-foreground">User ID {userId}</span>
              </div>
            </div>

            <p className="text-[12px] text-muted-foreground">
              The session is checked automatically and signed in again if the site logs it out.
            </p>

            {error && (
              <p role="alert" className="flex items-center gap-1.5 text-[12px] text-destructive">
                <AlertCircle className="size-3.5 shrink-0" />
                {error}
              </p>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleLogout}
                disabled={verifying}
                className="text-destructive"
              >
                {verifying ? <Loader2 className="animate-spin" /> : <LogOut />}
                {verifying ? 'Logging out…' : 'Log out'}
              </Button>
              <DialogClose asChild>
                <Button type="button" disabled={verifying}>
                  Done
                </Button>
              </DialogClose>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <DialogHeader>
              <DialogTitle>Site credentials</DialogTitle>
              <DialogDescription>The login NXLogSync uses to upload to {siteName}.</DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="credentials-user-id">User ID</Label>
              <Input
                id="credentials-user-id"
                value={draftUserId}
                onChange={(e) => {
                  setDraftUserId(e.target.value)
                  setError(null)
                }}
                disabled={verifying}
                aria-invalid={error !== null || undefined}
                autoComplete="username"
                spellCheck={false}
                autoFocus
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="credentials-password">Password</Label>
              <div className="relative">
                <Input
                  id="credentials-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    setError(null)
                  }}
                  disabled={verifying}
                  aria-invalid={error !== null || undefined}
                  autoComplete="current-password"
                  className="pr-9"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute top-1/2 right-1 -translate-y-1/2 text-muted-foreground"
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </Button>
              </div>
            </div>

            {error && (
              <p role="alert" className="flex items-center gap-1.5 text-[12px] text-destructive">
                <AlertCircle className="size-3.5 shrink-0" />
                {error}
              </p>
            )}

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={verifying}>
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={!canConnect}>
                {verifying && <Loader2 className="animate-spin" />}
                {verifying ? 'Connecting…' : 'Connect'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
