import { FileSpreadsheet, Loader2, Upload } from 'lucide-react'
import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { EXCEL_ACCEPT } from '@/constants/excel-report'
import { cn } from '@/lib/utils'

interface ImportDropzoneProps {
  title: string
  hint: string
  onFile: (file: File) => void
  /** True while the chosen file is being read. */
  busy?: boolean
  /** Why the last file could not be used. */
  error?: string | null
}

/** An empty import slot: drop an Excel file here or pick one. */
export function ImportDropzone({ title, hint, onFile, busy = false, error }: ImportDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [over, setOver] = useState(false)

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault()
        setOver(true)
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setOver(false)
        const file = e.dataTransfer.files[0]
        if (file && !busy) onFile(file)
      }}
      className={cn(
        'flex flex-col items-center gap-3 rounded-xl border border-dashed bg-card px-6 py-10 text-center transition-colors',
        over && 'border-primary bg-primary/5',
      )}
    >
      <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <FileSpreadsheet className="size-6" />
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-[12px] text-muted-foreground">{hint}</p>
      </div>
      <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => inputRef.current?.click()}>
        {busy ? <Loader2 className="animate-spin" /> : <Upload />}
        {busy ? 'Reading file…' : 'Choose file'}
      </Button>
      {error && (
        <p role="alert" className="text-[12px] text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={EXCEL_ACCEPT}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) onFile(file)
          e.target.value = ''
        }}
      />
    </div>
  )
}
