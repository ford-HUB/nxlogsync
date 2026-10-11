import { shapeOf } from '@/lib/tetris-engine'
import { cn } from '@/lib/utils'
import type { PieceType } from '@/types/tetris'

interface PiecePreviewProps {
  label: string
  pieces: (PieceType | null)[]
  /** Greyed out, e.g. the held piece after it was used for this drop. */
  dimmed?: boolean
}

/** One piece's filled cells only, trimmed of empty rows and columns. */
function trimmed(type: PieceType) {
  const m = shapeOf(type, 0).filter((row) => row.some(Boolean))
  const cols = m[0].map((_, c) => c).filter((c) => m.some((row) => row[c]))
  return m.map((row) => cols.map((c) => row[c]))
}

function MiniPiece({ type }: { type: PieceType | null }) {
  if (!type) return <div className="h-7" />
  const m = trimmed(type)
  return (
    <div className="flex h-7 items-center justify-center">
      <div className="grid gap-px" style={{ gridTemplateColumns: `repeat(${m[0].length}, 0.75rem)` }}>
        {m.flatMap((row, r) =>
          row.map((v, c) => <div key={`${r}-${c}`} className={cn('size-3 rounded-[2px]', v ? 'bg-foreground' : 'bg-transparent')} />),
        )}
      </div>
    </div>
  )
}

/** A small labelled column of pieces beside the board: the held piece, or what comes next. */
export function PiecePreview({ label, pieces, dimmed = false }: PiecePreviewProps) {
  return (
    <div className={cn('flex w-20 flex-col gap-3 font-mono transition-opacity', dimmed && 'opacity-35')}>
      <span className="text-center text-[10px] tracking-[0.18em] text-muted-foreground uppercase">{label}</span>
      <div className="flex flex-col gap-3">
        {pieces.map((type, i) => (
          <MiniPiece key={i} type={type} />
        ))}
      </div>
    </div>
  )
}
