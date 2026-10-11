import { WORKBOOK_SHEETS as SHEETS } from '@/constants/excel-report'
import { escapeXml } from '@/lib/sheet-xml'
import type { XlsxPackage } from '@/lib/xlsx-package'
import type { ActivityClass } from '@/types/excel-report'

/** A Page 3-Activity row as Page 2-Graph's chart shows it: one series named by D:G, valued by H:J. */
export interface ActivityChartRow {
  row: number
  description: string
  /** "1-Sep", as the sheet displays F. */
  dateLabel: string
  assignedTo: string
  classification: ActivityClass
}

const CLASS_INDEX: Record<ActivityClass, number> = { issue: 0, feature: 1, support: 2 }
const SERIES = /<c:ser>[\s\S]*?<\/c:ser>/g

/** Excel charts hold at most 255 series; past that the oldest activities drop off the graph. */
export const MAX_CHART_SERIES = 255

/** The stacked activity chart on Page 2-Graph, if the workbook has one. */
function activityChart(pkg: XlsxPackage): string | null {
  const drawing = pkg.drawingOf(pkg.sheetPath(SHEETS.graph))
  if (!drawing) return null
  return (
    pkg.chartsOf(drawing).find((path) => {
      const xml = pkg.text(path)
      return /<c:grouping val="stacked"\/>/.test(xml) && xml.includes(`'${SHEETS.activity}'!$H$`)
    }) ?? null
  )
}

/**
 * The Page 3-Activity rows the graph shows, in series order; null without the chart. The FEP
 * workbook's graph starts partway through the year because of the series limit.
 */
export function activityChartRows(pkg: XlsxPackage): number[] | null {
  const chart = activityChart(pkg)
  if (!chart) return null
  return (pkg.text(chart).match(SERIES) ?? []).map((ser) => Number(/\$H\$(\d+):/.exec(ser)?.[1] ?? 0))
}

/**
 * Page 2-Graph's ACTIVITY SUMMARY is a stacked cylinder chart with a series per Page 3-Activity
 * row, so it only shows the rows that existed when it was made. This adds a series for each new row,
 * copied from the chart's last series (which keeps Excel's colour cycling: series carry no fill).
 * With `replace` (a monthly graph, like FEP's "JULY 2026 ACTIVITY SUMMARY") the new rows are the
 * only series.
 */
export function addActivitySeries(pkg: XlsxPackage, rows: ActivityChartRow[], replace = false): void {
  const chart = activityChart(pkg)
  if (!chart || !rows.length) return
  const sheetRef = `'${SHEETS.activity}'!`

  const xml = pkg.text(chart)
  const series = xml.match(SERIES) ?? []
  const last = series[series.length - 1]
  if (!last) return
  const count = series.length

  const added = rows
    .map((r, i) => {
      const n = count + i
      const value = CLASS_INDEX[r.classification]
      return last
        .replace(/<c:idx val="\d+"\/>/, `<c:idx val="${n}"/>`)
        .replace(/<c:order val="\d+"\/>/, `<c:order val="${n}"/>`)
        .replace(/<c:extLst>[\s\S]*?<\/c:extLst>/, '')
        .replace(
          /<c:tx>[\s\S]*?<\/c:tx>/,
          `<c:tx><c:strRef><c:f>${escapeXml(sheetRef)}$D$${r.row}:$G$${r.row}</c:f><c:strCache><c:ptCount val="3"/>` +
            [r.description, r.dateLabel, r.assignedTo]
              .map((v, k) => `<c:pt idx="${k}"><c:v>${escapeXml(v)}</c:v></c:pt>`)
              .join('') +
            '</c:strCache></c:strRef></c:tx>',
        )
        .replace(
          /<c:val>[\s\S]*?<\/c:val>/,
          `<c:val><c:numRef><c:f>${escapeXml(sheetRef)}$H$${r.row}:$J$${r.row}</c:f><c:numCache><c:formatCode>General</c:formatCode>` +
            `<c:ptCount val="3"/><c:pt idx="${value}"><c:v>1</c:v></c:pt></c:numCache></c:numRef></c:val>`,
        )
    })
    .join('')

  // All series, oldest dropped past the limit, renumbered in order.
  const all = [...(replace ? [] : series), ...(added.match(SERIES) ?? [])].slice(-MAX_CHART_SERIES).map((ser, i) =>
    ser.replace(/<c:idx val="\d+"\/>/, `<c:idx val="${i}"/>`).replace(/<c:order val="\d+"\/>/, `<c:order val="${i}"/>`),
  )
  const start = xml.indexOf('<c:ser>')
  const end = xml.lastIndexOf('</c:ser>') + '</c:ser>'.length
  pkg.setText(chart, xml.slice(0, start) + all.join('') + xml.slice(end))
}
