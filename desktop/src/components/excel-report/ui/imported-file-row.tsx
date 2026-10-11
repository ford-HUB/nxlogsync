import { FileSpreadsheet, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ImportedFileRowProps {
  fileName: string
  meta: string
  removeLabel: string
  onRemove: () => void
}

/** A filled import slot: the file's name and what was read from it, with a way to take it back out. */
export function ImportedFileRow({ fileName, meta, removeLabel, onRemove }: ImportedFileRowProps) {
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-muted/30 px-3 py-2">
      <FileSpreadsheet className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-[13px] font-medium">{fileName}</span>
        <span className="truncate text-[11px] text-muted-foreground">{meta}</span>
      </div>
      <Button type="button" variant="ghost" size="icon" aria-label={removeLabel} className="size-7 text-muted-foreground" onClick={onRemove}>
        <X />
      </Button>
    </div>
  )
}
