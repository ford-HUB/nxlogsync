import { AlertCircle, Globe, PlugZap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CONNECTION_DOT, CONNECTION_LABEL, formatRunTime, SCHEDULE_ISSUE_MESSAGE } from '@/constants/sync-schedule'
import type { SyncScheduleState } from '@/hooks/use-sync-schedule'
import { cn } from '@/lib/utils'
import { CredentialsDialog } from './credentials-dialog'

interface TargetSiteCardProps {
  schedule: SyncScheduleState
}

export function TargetSiteCard({ schedule: s }: TargetSiteCardProps) {
  const { target } = s
  const urlInvalid = s.issue === 'invalid-url'

  return (
    <Card className="gap-0 py-0 shadow-sm">
      <CardHeader className="border-b py-4">
        <CardTitle>Target site</CardTitle>
        <CardDescription className="text-[12px]">Where each sync uploads your entries</CardDescription>
        <CardAction className="flex gap-2">
          <CredentialsDialog
            siteName={target.name}
            userId={target.userId}
            connection={target.connection}
            onConnect={s.connect}
            onLogout={s.logout}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={s.testConnection}
            disabled={target.connection === 'checking' || urlInvalid || target.userId === null}
          >
            <PlugZap />
            Test
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent className="flex flex-col gap-3 py-4">
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
            <Globe className="size-4 text-muted-foreground" />
          </div>
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-[13px] font-medium">{target.name}</span>
            <span className="truncate text-[12px] text-muted-foreground">
              {target.userId ? `User ID ${target.userId}` : 'Not signed in'}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="target-url" className="text-[11px] tracking-wider text-muted-foreground uppercase">
            Address
          </Label>
          <Input
            id="target-url"
            value={s.draft.targetUrl}
            readOnly
            disabled
            aria-invalid={urlInvalid || undefined}
            spellCheck={false}
            className="text-[13px]"
          />
          {urlInvalid && (
            <p role="alert" className="flex items-center gap-1.5 text-[12px] text-destructive">
              <AlertCircle className="size-3.5" />
              {SCHEDULE_ISSUE_MESSAGE['invalid-url']}
            </p>
          )}
        </div>

        <p className="flex items-center gap-2 text-[12px] text-muted-foreground">
          <span className={cn('size-2 shrink-0 rounded-full', CONNECTION_DOT[target.connection])} />
          <span className="text-foreground">{CONNECTION_LABEL[target.connection]}</span>
          {target.connection !== 'checking' && target.userId !== null && (
            <span>· checked {formatRunTime(target.checkedAt, s.now)}</span>
          )}
        </p>
      </CardContent>
    </Card>
  )
}
