import { Card } from '@/components/ui/card'
import { HOUR_BUCKET_LABEL, HOUR_BUCKET_ORDER } from '@/constants/excel-report'
import type { ReportKind, RequestHours } from '@/types/excel-report'

interface RequestHoursTableProps {
  kind: ReportKind
  requests: RequestHours[]
}

/**
 * Page 4-Request as it will be filled: each request's total and its estimated Investigate /
 * Development / QA / Support hours, with the rule that placed them. Empty cells stay blank, as in
 * the workbook.
 */
export function RequestHoursTable({ kind, requests }: RequestHoursTableProps) {
  const totals = Object.fromEntries(
    HOUR_BUCKET_ORDER.map((b) => [b, requests.reduce((sum, r) => sum + r.split[b], 0)]),
  ) as Record<(typeof HOUR_BUCKET_ORDER)[number], number>
  const total = requests.reduce((sum, r) => sum + r.total, 0)

  return (
    <Card className="flex flex-col gap-0 overflow-hidden p-0">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 border-b px-4 py-3">
        <h2 className="text-sm font-semibold">Page 4 · Request hours</h2>
        <span className="text-[11px] text-muted-foreground">
          {kind === 'FEM'
            ? 'Estimated: feature work split, everything else in one row'
            : 'One row per request, as FEP files them'}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead className="border-b bg-muted/40 text-left text-[11px] tracking-wider text-muted-foreground uppercase">
            <tr>
              <th className="px-3 py-2 font-medium">Request / fixing description</th>
              <th className="px-3 py-2 font-medium">Date</th>
              <th className="px-3 py-2 text-right font-medium">Total</th>
              {HOUR_BUCKET_ORDER.map((b) => (
                <th key={b} className="px-3 py-2 text-right font-medium whitespace-nowrap">
                  {HOUR_BUCKET_LABEL[b].split('/')[0]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {requests.map((r) => (
              <tr key={`${r.date}-${r.description}`} className="border-b last:border-0">
                <td className="max-w-96 px-3 py-2">
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate">{r.description}</span>
                    <span className="truncate text-[11px] text-muted-foreground">
                      {r.rule}
                      {r.entries > 1 && ` · ${r.entries} entries`}
                    </span>
                  </div>
                </td>
                <td className="px-3 py-2 whitespace-nowrap tabular-nums">{r.date}</td>
                <td className="px-3 py-2 text-right font-semibold tabular-nums">{r.total}</td>
                {HOUR_BUCKET_ORDER.map((b) => (
                  <td key={b} className="px-3 py-2 text-right tabular-nums">
                    {r.split[b] || ''}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t bg-muted/40 text-[12px] font-semibold">
            <tr>
              <td className="px-3 py-2" colSpan={2}>
                Total
              </td>
              <td className="px-3 py-2 text-right tabular-nums">{total}</td>
              {HOUR_BUCKET_ORDER.map((b) => (
                <td key={b} className="px-3 py-2 text-right tabular-nums">
                  {totals[b] || ''}
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>
    </Card>
  )
}
