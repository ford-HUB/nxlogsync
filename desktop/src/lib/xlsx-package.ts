import { strFromU8, strToU8, unzipSync, zipSync } from 'fflate'

const REL_CALC_CHAIN = /<Relationship\b[^>]*Target="calcChain\.xml"[^>]*\/>/
const TYPE_CALC_CHAIN = /<Override\b[^>]*PartName="\/xl\/calcChain\.xml"[^>]*\/>/

/** "worksheets/sheet1.xml" relative to "xl/workbook.xml" → "xl/worksheets/sheet1.xml" */
function resolvePart(base: string, target: string): string {
  if (target.startsWith('/')) return target.slice(1)
  const parts = base.split('/').slice(0, -1)
  for (const seg of target.split('/')) {
    if (seg === '..') parts.pop()
    else if (seg !== '.') parts.push(seg)
  }
  return parts.join('/')
}

/** A part's relationships file: "xl/worksheets/sheet1.xml" → "xl/worksheets/_rels/sheet1.xml.rels" */
const relsOf = (part: string) => part.replace(/([^/]+)$/, '_rels/$1.rels')

/**
 * An .xlsx / .xlsm opened as its zip parts, for editing parts in place. Everything not edited —
 * vbaProject.bin, charts, drawings, styles — is written back byte for byte.
 */
export class XlsxPackage {
  private constructor(private files: Record<string, Uint8Array>) {}

  static read(bytes: Uint8Array): XlsxPackage {
    return new XlsxPackage(unzipSync(bytes))
  }

  has(path: string): boolean {
    return path in this.files
  }

  text(path: string): string {
    const file = this.files[path]
    if (!file) throw new Error(`The workbook has no ${path}.`)
    return strFromU8(file)
  }

  setText(path: string, text: string): void {
    this.files[path] = strToU8(text)
  }

  /** The worksheet part of a sheet, by its tab name. */
  sheetPath(name: string): string {
    const workbook = this.text('xl/workbook.xml')
    const escaped = name.replace(/&/g, '&amp;').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const rid = new RegExp(`<sheet\\b[^>]*name="${escaped}"[^>]*r:id="([^"]+)"`).exec(workbook)?.[1]
    if (!rid) throw new Error(`The workbook has no "${name}" sheet.`)
    return this.relTarget('xl/workbook.xml', (rel) => rel.includes(`Id="${rid}"`)) ?? ''
  }

  /** The 0-based position of a sheet among the workbook's sheets (definedName localSheetId). */
  sheetIndex(name: string): number {
    const names = [...this.text('xl/workbook.xml').matchAll(/<sheet\b[^>]*name="([^"]+)"/g)].map((m) => m[1])
    return names.indexOf(name.replace(/&/g, '&amp;'))
  }

  /** The drawing part a worksheet shows, if any. */
  drawingOf(sheetPath: string): string | null {
    return this.relTarget(sheetPath, (rel) => rel.includes('/relationships/drawing"'))
  }

  /** The chart parts a drawing shows. */
  chartsOf(drawingPath: string): string[] {
    const relsPath = relsOf(drawingPath)
    if (!this.has(relsPath)) return []
    return (this.text(relsPath).match(/<Relationship\b[^>]*\/>/g) ?? [])
      .filter((rel) => rel.includes('/relationships/chart"'))
      .map((rel) => resolvePart(drawingPath, /Target="([^"]+)"/.exec(rel)?.[1] ?? ''))
  }

  /** Sets the last row of a sheet's print area ('Sheet'!$A$1:$X$41 → …$X$<lastRow>). */
  setPrintAreaLastRow(sheetName: string, lastRow: number): void {
    const index = this.sheetIndex(sheetName)
    const workbook = this.text('xl/workbook.xml').replace(
      new RegExp(`(<definedName name="_xlnm\\.Print_Area" localSheetId="${index}">[^<]*?\\$[A-Z]+\\$)(\\d+)(</definedName>)`),
      (_, head, _row, end) => `${head}${lastRow}${end}`,
    )
    this.setText('xl/workbook.xml', workbook)
  }

  /** The current last row of a sheet's print area, or null without one. */
  printAreaLastRow(sheetName: string): number | null {
    const index = this.sheetIndex(sheetName)
    const m = new RegExp(`<definedName name="_xlnm\\.Print_Area" localSheetId="${index}">[^<]*?\\$[A-Z]+\\$(\\d+)</definedName>`).exec(
      this.text('xl/workbook.xml'),
    )
    return m ? Number(m[1]) : null
  }

  /**
   * After formulas were written: drop the calculation chain (it lists the old formula cells, and a
   * stale one makes Excel repair the file) and have Excel recalculate everything when it opens.
   */
  recalculateOnOpen(): void {
    delete this.files['xl/calcChain.xml']
    const rels = 'xl/_rels/workbook.xml.rels'
    this.setText(rels, this.text(rels).replace(REL_CALC_CHAIN, ''))
    this.setText('[Content_Types].xml', this.text('[Content_Types].xml').replace(TYPE_CALC_CHAIN, ''))
    let workbook = this.text('xl/workbook.xml')
    workbook = /<calcPr\b/.test(workbook)
      ? workbook.replace(/<calcPr\b([^>]*?)\s*\/>/, (_, attrs: string) =>
          `<calcPr${attrs.replace(/\s*fullCalcOnLoad="[^"]*"/, '')} fullCalcOnLoad="1"/>`,
        )
      : workbook.replace('</workbook>', '<calcPr fullCalcOnLoad="1"/></workbook>')
    this.setText('xl/workbook.xml', workbook)
  }

  bytes(): Uint8Array {
    return zipSync(this.files, { level: 6 })
  }

  private relTarget(part: string, match: (rel: string) => boolean): string | null {
    const relsPath = relsOf(part)
    if (!this.has(relsPath)) return null
    const rel = this.text(relsPath).match(/<Relationship\b[^>]*\/>/g)?.find(match)
    const target = rel && /Target="([^"]+)"/.exec(rel)?.[1]
    return target ? resolvePart(part, target) : null
  }
}
