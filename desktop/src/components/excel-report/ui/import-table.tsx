import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { IMPORT_STATUS_BADGE, IMPORT_STATUS_LABEL } from '@/constants/excel-report'
import { cn } from '@/lib/utils'
import type { ImportedRow } from '@/types/excel-report'

interface ImportTableProps {
  rows: ImportedRow[]
}

const empty = <span className="text-muted-foreground">—</span>

/**
 * The manhour entries the pre-template extracted; On Route rows (added because Approved lacked them)
 * are tagged, and a flagged row explains itself on hover.
 */
export function ImportTable({ rows }: ImportTableProps) {
  return (
    <Card className="overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead className="border-b bg-muted/40 text-left text-[11px] tracking-wider text-muted-foreground uppercase">
            <tr>
              <th className="px-3 py-2 font-medium">Date</th>
              <th className="px-3 py-2 font-medium">Job code</th>
              <th className="px-3 py-2 font-medium">Employee</th>
              <th className="px-3 py-2 font-medium">Work activity</th>
              <th className="px-3 py-2 text-right font-medium">Hours</th>
              <th className="px-3 py-2 font-medium">Remarks</th>
              <th className="px-3 py-2 font-medium">Source</th>
              <th className="px-3 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const badge = (
                <span className={cn('rounded-md px-1.5 py-0.5 text-[11px] font-medium whitespace-nowrap', IMPORT_STATUS_BADGE[r.status])}>
                  {IMPORT_STATUS_LABEL[r.status]}
                </span>
              )
              return (
                <tr key={r.id} className="border-b last:border-0">
                  <td className="px-3 py-2 whitespace-nowrap tabular-nums">{r.date}</td>
                  <td className="px-3 py-2 font-mono text-[12px] whitespace-nowrap">{r.jobCode}</td>
                  <td className="max-w-40 truncate px-3 py-2">{r.employeeName}</td>
                  <td className="max-w-48 px-3 py-2">
                    <div className="flex min-w-0 flex-col">
                      <span className="font-mono text-[12px]">{r.workAccount || empty}</span>
                      {r.workActivityName && (
                        <span className="truncate text-[11px] text-muted-foreground">{r.workActivityName}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">{r.hours ?? empty}</td>
                  <td className="max-w-80 truncate px-3 py-2">{r.remarks}</td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {r.approval === 'on-route' ? (
                      <Badge variant="outline">On Route</Badge>
                    ) : (
                      <span className="text-[12px] text-muted-foreground">Approved</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {r.issue ? (
                      <Tooltip>
                        <TooltipTrigger asChild>{badge}</TooltipTrigger>
                        <TooltipContent>{r.issue}</TooltipContent>
                      </Tooltip>
                    ) : (
                      badge
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
