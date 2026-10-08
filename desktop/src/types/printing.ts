/** A printer installed on this computer. */
export interface Printer {
  name: string
  displayName: string
  isDefault: boolean
}

/** Where the print dialog sends the report: a printer by its OS name, or a PDF file. */
export type PrintDestination = { kind: 'printer'; name: string } | { kind: 'pdf' }
