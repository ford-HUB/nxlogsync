import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useSignOffStore } from '@/store/sign-off-store'
import type { ReportKind, SignOffStamp } from '@/types/excel-report'

/** "10.11.26" ⇄ "2026-10-11" for the date input. */
const toInput = (date: string) => {
  const [m, d, y] = date.split('.')
  return m && d && y ? `20${y}-${m}-${d}` : ''
}
const fromInput = (value: string) => {
  const [y, m, d] = value.split('-')
  return y && m && d ? `${m}.${d}.${y.slice(2)}` : ''
}

const initialsValue = (value: string) => value.toUpperCase().replace(/[^A-Z/]/g, '').slice(0, 8)

interface SignOffFieldsProps {
  kind: ReportKind
  /** The workbook's current stamps; the third keeps its initials. */
  stamps: SignOffStamp[]
}

/**
 * The red N-PAX stamps under NO OF DAYS: the date created on all three, the supervisor's initials on
 * the first and the preparer's on the second. Typed here instead of looked up, so generating a
 * report never waits on the workflow site.
 */
export function SignOffFields({ kind, stamps }: SignOffFieldsProps) {
  const date = useSignOffStore((s) => s.date)
  const setDate = useSignOffStore((s) => s.setDate)
  const setInitials = useSignOffStore((s) => s.setInitials)
  const supervisor = useSignOffStore((s) => s.initialsFor(kind).supervisor)
  const preparedBy = useSignOffStore((s) => s.initialsFor(kind).preparedBy)
  const third = stamps[2]?.initials

  return (
    <div className="grid gap-3 sm:grid-cols-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="sign-off-date" className="text-[12px]">
          Date created
        </Label>
        <Input id="sign-off-date" type="date" value={toInput(date)} onChange={(e) => setDate(fromInput(e.target.value))} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="sign-off-supervisor" className="text-[12px]">
          Supervisor · 1st stamp
        </Label>
        <Input
          id="sign-off-supervisor"
          value={supervisor}
          placeholder="LLJ"
          onChange={(e) => setInitials(kind, { supervisor: initialsValue(e.target.value) })}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="sign-off-prepared" className="text-[12px]">
          Prepared by · 2nd stamp
        </Label>
        <Input
          id="sign-off-prepared"
          value={preparedBy}
          placeholder="CDB"
          onChange={(e) => setInitials(kind, { preparedBy: initialsValue(e.target.value) })}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-[12px] leading-none font-medium">3rd stamp</span>
        <span className="flex h-8 items-center text-[13px] text-muted-foreground">
          {third ? `${third} · date only` : 'Not in this workbook'}
        </span>
      </div>
    </div>
  )
}
