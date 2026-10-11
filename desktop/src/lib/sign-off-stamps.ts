import { WORKBOOK_SHEETS } from '@/constants/excel-report'
import type { XlsxPackage } from '@/lib/xlsx-package'
import type { SignOffStamp } from '@/types/excel-report'

/**
 * The red N-PAX sign-off stamps under NO OF DAYS are drawing shapes on the front page: per stamp an
 * oval and three text boxes stacked top to bottom — "N-PAX", the date ("09.03.26") and the initials.
 */
interface StampBox {
  /** The whole anchor element, to rewrite its text in place. */
  xml: string
  col: number
  row: number
  text: string
}

const ANCHOR = /<xdr:(twoCellAnchor|oneCellAnchor)\b[\s\S]*?<\/xdr:\1>/g

function textBoxes(drawing: string): StampBox[] {
  return [...drawing.matchAll(ANCHOR)]
    .map((m) => m[0])
    .filter((xml) => /txBox="1"/.test(xml) && /<a:t>/.test(xml))
    .map((xml) => ({
      xml,
      col: Number(/<xdr:from><xdr:col>(\d+)<\/xdr:col>/.exec(xml)?.[1] ?? -1),
      row: Number(/<xdr:from>[\s\S]*?<xdr:row>(\d+)<\/xdr:row>/.exec(xml)?.[1] ?? -1),
      text: [...xml.matchAll(/<a:t>([^<]*)<\/a:t>/g)].map((t) => t[1]).join('').trim(),
    }))
}

/** The stamps' text boxes, left to right, each as [label, date, initials] (top to bottom). */
function stampGroups(drawing: string): StampBox[][] {
  const labels = textBoxes(drawing).filter((b) => /^N-?PAX$/i.test(b.text))
  const boxes = textBoxes(drawing)
  return labels
    .sort((a, b) => a.col - b.col)
    .map((label) => {
      const below = boxes
        .filter((b) => b !== label && Math.abs(b.col - label.col) <= 1 && b.row > label.row && b.row <= label.row + 3)
        .sort((a, b) => a.row - b.row)
      return [label, ...below.slice(0, 2)]
    })
    .filter((g) => g.length === 3)
}

const frontDrawing = (pkg: XlsxPackage) => pkg.drawingOf(pkg.sheetPath(WORKBOOK_SHEETS.front))

/** The sign-off stamps as the workbook has them, left to right. */
export function readStamps(pkg: XlsxPackage): SignOffStamp[] {
  const drawing = frontDrawing(pkg)
  if (!drawing) return []
  return stampGroups(pkg.text(drawing)).map(([label, date, initials]) => ({
    label: label.text,
    date: date.text,
    initials: initials.text,
  }))
}

/** Puts a text box's text in its first run and empties the others, keeping the run's font. */
const withText = (xml: string, text: string) => {
  let first = true
  return xml.replace(/<a:t>[^<]*<\/a:t>/g, () => {
    const out = `<a:t>${first ? text.replace(/&/g, '&amp;').replace(/</g, '&lt;') : ''}</a:t>`
    first = false
    return out
  })
}

/** Rewrites each stamp's date and initials; stamps beyond `stamps` are left as they are. */
export function writeStamps(pkg: XlsxPackage, stamps: SignOffStamp[]): void {
  const drawing = frontDrawing(pkg)
  if (!drawing) return
  let xml = pkg.text(drawing)
  stampGroups(xml).forEach(([, date, initials], i) => {
    const stamp = stamps[i]
    if (!stamp) return
    xml = xml.replace(date.xml, withText(date.xml, stamp.date)).replace(initials.xml, withText(initials.xml, stamp.initials))
  })
  pkg.setText(drawing, xml)
}

/** 2026-10-11 → "10.11.26", the stamps' date format. */
export function stampDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(date.getMonth() + 1)}.${pad(date.getDate())}.${pad(date.getFullYear() % 100)}`
}
