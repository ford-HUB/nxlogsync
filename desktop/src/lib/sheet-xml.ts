/**
 * String-level editing of one worksheet part (xl/worksheets/sheetN.xml) of an existing workbook,
 * so a filled template keeps everything a spreadsheet library would drop: styles, charts, drawings,
 * macros and print setup. Only the rows, cells, merges, row breaks and dimension are parsed; the rest
 * of the part is written back untouched.
 */

/** "AW" → 49 */
export const colToNum = (col: string) => [...col].reduce((n, ch) => n * 26 + ch.charCodeAt(0) - 64, 0)

/** 49 → "AW" */
export function numToCol(n: number): string {
  let s = ''
  for (let x = n; x > 0; x = Math.floor((x - 1) / 26)) s = String.fromCharCode(65 + ((x - 1) % 26)) + s
  return s
}

/** "AW12" → { col: 49, row: 12 } */
export function splitRef(ref: string): { col: number; row: number } {
  const m = /^\$?([A-Z]+)\$?(\d+)$/.exec(ref)
  if (!m) throw new Error(`Not a cell reference: ${ref}`)
  return { col: colToNum(m[1]), row: Number(m[2]) }
}

export const escapeXml = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** A cell's content, written the way Excel writes it. */
export type CellContent =
  | { number: number }
  | { text: string }
  | { formula: string; cached: number | string }
  | { empty: true }

interface Cell {
  col: number
  /** The style index (s attribute), kept when the content changes. */
  style: string | null
  /** Attributes and inner XML as read; null once the cell was written. */
  raw: { attrs: string; inner: string } | null
  content: CellContent | null
}

/** A row's look without its content. */
export interface RowStyle {
  attrs: string
  styles: [number, string | null][]
}

interface Row {
  /** Row attributes other than r and spans (spans is optional and goes stale when cells change). */
  attrs: string
  cells: Map<number, Cell>
}

const attr = (attrs: string, name: string) => new RegExp(`\\b${name}="([^"]*)"`).exec(attrs)?.[1] ?? null
const dropAttr = (attrs: string, name: string) => attrs.replace(new RegExp(`\\s*\\b${name}="[^"]*"`), '')

/** "B14:B25" → rows 14 and 25, columns 2 and 2 */
function rangeOf(ref: string) {
  const [a, b = a] = ref.split(':')
  const from = splitRef(a)
  const to = splitRef(b)
  return { c1: from.col, r1: from.row, c2: to.col, r2: to.row }
}

const rangeRef = (c1: number, r1: number, c2: number, r2: number) =>
  c1 === c2 && r1 === r2 ? `${numToCol(c1)}${r1}` : `${numToCol(c1)}${r1}:${numToCol(c2)}${r2}`

/** Elements that come after sheetData and before mergeCells in the schema's order. */
const BEFORE_MERGES = /^(\s*<(sheetCalcPr|sheetProtection|protectedRanges|scenarios|autoFilter|sortState|dataConsolidate|customSheetViews)\b[\s\S]*?(\/>|<\/\2>))*/
/** Elements that come after rowBreaks in the schema's order. */
const AFTER_ROW_BREAKS =
  /<(colBreaks|customProperties|cellWatches|ignoredErrors|smartTags|drawing|legacyDrawing|legacyDrawingHF|picture|oleObjects|controls|webPublishItems|tableParts|extLst)\b/

export class SheetXml {
  private head: string
  private tail: string
  private rows = new Map<number, Row>()
  private merges: { c1: number; r1: number; c2: number; r2: number }[] = []
  private breaks: { id: number; attrs: string }[] | null = null

  constructor(xml: string) {
    const m = /<sheetData\s*\/>|<sheetData>([\s\S]*?)<\/sheetData>/.exec(xml)
    if (!m) throw new Error('Worksheet has no sheetData.')
    this.head = xml.slice(0, m.index)
    this.tail = xml.slice(m.index + m[0].length)

    for (const rm of (m[1] ?? '').matchAll(/<row\b([^>]*?)(?:\/>|>([\s\S]*?)<\/row>)/g)) {
      const r = Number(attr(rm[1], 'r'))
      const cells = new Map<number, Cell>()
      for (const cm of (rm[2] ?? '').matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
        const { col } = splitRef(attr(cm[1], 'r') ?? '')
        cells.set(col, {
          col,
          style: attr(cm[1], 's'),
          raw: { attrs: dropAttr(cm[1], 'r'), inner: cm[2] ?? '' },
          content: null,
        })
      }
      this.rows.set(r, { attrs: dropAttr(dropAttr(rm[1], 'r'), 'spans'), cells })
    }

    const mc = /<mergeCells\b[^>]*>([\s\S]*?)<\/mergeCells>/.exec(this.tail)
    if (mc) {
      this.merges = [...mc[1].matchAll(/<mergeCell ref="([^"]+)"\s*\/>/g)].map((x) => rangeOf(x[1]))
      this.tail = this.tail.replace(mc[0], '<!--merges-->')
    } else {
      const before = BEFORE_MERGES.exec(this.tail)?.[0] ?? ''
      this.tail = `${before}<!--merges-->${this.tail.slice(before.length)}`
    }

    const rb = /<rowBreaks\b[^>]*>([\s\S]*?)<\/rowBreaks>/.exec(this.tail)
    if (rb) {
      this.breaks = [...rb[1].matchAll(/<brk\b([^>]*?)\/>/g)].map((x) => ({
        id: Number(attr(x[1], 'id')),
        attrs: dropAttr(x[1], 'id'),
      }))
      this.tail = this.tail.replace(rb[0], '<!--breaks-->')
    } else {
      const at = AFTER_ROW_BREAKS.exec(this.tail)?.index ?? this.tail.lastIndexOf('</worksheet>')
      this.tail = `${this.tail.slice(0, at)}<!--breaks-->${this.tail.slice(at)}`
    }
  }

  /** The last row that has a row element. */
  get lastRow(): number {
    return Math.max(0, ...this.rows.keys())
  }

  hasRow(r: number): boolean {
    return this.rows.has(r)
  }

  /** The cell's style index, or null when the cell has none or doesn't exist. */
  styleOf(ref: string): string | null {
    const { col, row } = splitRef(ref)
    return this.rows.get(row)?.cells.get(col)?.style ?? null
  }

  /** Writes a cell's content, keeping its style (or giving it `style` when it has none). */
  set(ref: string, content: CellContent, style?: string | null): void {
    const { col, row } = splitRef(ref)
    const r = this.rows.get(row) ?? this.addRow(row)
    const existing = r.cells.get(col)
    r.cells.set(col, { col, style: existing?.style ?? style ?? null, raw: null, content })
  }

  /** Sets (or clears, with null) a row's custom height in points. */
  setRowHeight(row: number, height: number | null): void {
    const r = this.rows.get(row) ?? this.addRow(row)
    const attrs = dropAttr(dropAttr(r.attrs, 'ht'), 'customHeight')
    r.attrs = height === null ? attrs : `${attrs} ht="${height}" customHeight="1"`
  }

  /** A row's height and cell styles, to stamp onto other rows (see applyRowStyle). */
  rowStyle(row: number): RowStyle {
    const src = this.rows.get(row)
    return { attrs: src?.attrs ?? '', styles: [...(src?.cells.values() ?? [])].map((c) => [c.col, c.style]) }
  }

  /**
   * Replaces row `to` with the style of row `from` (or a saved rowStyle): same height and cell
   * styles, no values or formulas (a copied formula would point at the wrong rows). Merges are not
   * copied; see copyMerges.
   */
  copyRowStyle(from: number | RowStyle, to: number): void {
    const { attrs, styles } = typeof from === 'number' ? this.rowStyle(from) : from
    const cells = new Map<number, Cell>()
    for (const [col, style] of styles) cells.set(col, { col, style, raw: null, content: { empty: true } })
    this.rows.set(to, { attrs, cells })
  }

  /** Copies the merges whose top row is in fromRow..fromRow+count-1 down by (toRow - fromRow). */
  copyMerges(fromRow: number, count: number, toRow: number): void {
    const delta = toRow - fromRow
    for (const m of this.merges.filter((x) => x.r1 >= fromRow && x.r1 < fromRow + count))
      this.addMerge(rangeRef(m.c1, m.r1 + delta, m.c2, m.r2 + delta))
  }

  /** Adds a merge, dropping any merge it overlaps (Excel refuses overlapping merges). */
  addMerge(ref: string): void {
    const m = rangeOf(ref)
    this.merges = this.merges.filter((x) => x.r2 < m.r1 || x.r1 > m.r2 || x.c2 < m.c1 || x.c1 > m.c2)
    this.merges.push(m)
  }

  /** Removes every merge that touches rows r1..r2. */
  removeMergesInRows(r1: number, r2: number): void {
    this.merges = this.merges.filter((x) => x.r2 < r1 || x.r1 > r2)
  }

  deleteRow(row: number): void {
    this.rows.delete(row)
  }

  /**
   * Moves every row from `from` down by `delta` (up when negative; the rows it lands on must have been
   * deleted first), with the merges and row breaks below. Formulas in moved rows are not rewritten,
   * so this is only for parts of a sheet that hold no formulas.
   */
  shiftRows(from: number, delta: number): void {
    if (!delta) return
    const moved = [...this.rows].sort((a, b) => (delta > 0 ? b[0] - a[0] : a[0] - b[0]))
    for (const [r, row] of moved) {
      if (r < from) continue
      this.rows.delete(r)
      this.rows.set(r + delta, row)
    }
    for (const m of this.merges) {
      if (m.r1 >= from) m.r1 += delta
      if (m.r2 >= from) m.r2 += delta
    }
    for (const b of this.breaks ?? []) if (b.id >= from) b.id += delta
  }

  /** Manual page break after each of these rows (Excel's brk id is the last row of a page). */
  addRowBreaks(rows: number[], maxCol: number): void {
    this.breaks ??= []
    const attrs = ` max="${maxCol - 1}" man="1"`
    for (const id of rows) if (!this.breaks.some((b) => b.id === id)) this.breaks.push({ id, attrs })
  }

  /** Removes the manual page breaks after rows r1..r2. */
  removeRowBreaks(r1: number, r2: number): void {
    if (this.breaks) this.breaks = this.breaks.filter((b) => b.id < r1 || b.id > r2)
  }

  get rowBreaks(): number[] {
    return (this.breaks ?? []).map((b) => b.id)
  }

  toString(): string {
    const rows = [...this.rows]
      .sort((a, b) => a[0] - b[0])
      .map(([r, row]) => {
        const cells = [...row.cells.values()].sort((a, b) => a.col - b.col).map((c) => cellXml(`${numToCol(c.col)}${r}`, c))
        return cells.length ? `<row r="${r}"${row.attrs}>${cells.join('')}</row>` : `<row r="${r}"${row.attrs}/>`
      })
      .join('')

    const merges = this.merges.length
      ? `<mergeCells count="${this.merges.length}">${this.merges
          .map((m) => `<mergeCell ref="${rangeRef(m.c1, m.r1, m.c2, m.r2)}"/>`)
          .join('')}</mergeCells>`
      : ''
    const breaks = this.breaks?.length
      ? `<rowBreaks count="${this.breaks.length}" manualBreakCount="${this.breaks.length}">${[...this.breaks]
          .sort((a, b) => a.id - b.id)
          .map((b) => `<brk id="${b.id}"${b.attrs}/>`)
          .join('')}</rowBreaks>`
      : ''

    const last = this.lastRow
    const head = this.head.replace(/<dimension ref="([A-Z]+)(\d+)(?::([A-Z]+)(\d+))?"\s*\/>/, (whole, c1, r1, c2) =>
      c2 && last ? `<dimension ref="${c1}${r1}:${c2}${Math.max(last, Number(r1))}"/>` : whole,
    )
    return `${head}<sheetData>${rows}</sheetData>${this.tail.replace('<!--merges-->', merges).replace('<!--breaks-->', breaks)}`
  }

  private addRow(row: number): Row {
    const r: Row = { attrs: '', cells: new Map() }
    this.rows.set(row, r)
    return r
  }
}

function cellXml(ref: string, c: Cell): string {
  if (c.raw) return c.raw.inner ? `<c r="${ref}"${c.raw.attrs}>${c.raw.inner}</c>` : `<c r="${ref}"${c.raw.attrs}/>`
  const s = c.style !== null ? ` s="${c.style}"` : ''
  const content = c.content
  if (!content || 'empty' in content) return `<c r="${ref}"${s}/>`
  if ('number' in content) return `<c r="${ref}"${s}><v>${content.number}</v></c>`
  if ('text' in content)
    return `<c r="${ref}"${s} t="inlineStr"><is><t xml:space="preserve">${escapeXml(content.text)}</t></is></c>`
  const f = `<f>${escapeXml(content.formula)}</f>`
  return typeof content.cached === 'number'
    ? `<c r="${ref}"${s}>${f}<v>${content.cached}</v></c>`
    : `<c r="${ref}"${s} t="str">${f}<v>${escapeXml(content.cached)}</v></c>`
}
