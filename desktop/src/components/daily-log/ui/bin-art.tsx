import { AnimatePresence, motion } from "motion/react";
import { useId } from "react";

interface BinArtProps {
  /** Lid angle in degrees, hinged at its left end; negative opens it. */
  lid: number;
  /** The dragged task is over the bin: the lid springs looser. */
  over: boolean;
  /** Set-aside tasks; up to three sheets of paper peek over the rim. */
  count: number;
}

/** Sheets that peek over the rim, in the order they appear. */
const SHEETS = [
  { x: 14, y: 6.5, rotate: -14, w: 9, h: 10 },
  { x: 25, y: 5.5, rotate: 10, w: 9, h: 10 },
  { x: 19.5, y: 4, rotate: -3, w: 8, h: 11 },
];

/**
 * A grey wheelie recycling bin: body with a PAPER label and the recycle mark, two
 * wheels, and a lid that tips open. The colours are fixed (it is an illustration),
 * so it reads the same in light and dark themes.
 */
export function BinArt({ lid, over, count }: BinArtProps) {
  const id = useId();
  const bodyFill = `${id}-body`;
  const lidFill = `${id}-lid`;
  const sheets = SHEETS.slice(0, Math.min(count, SHEETS.length));

  return (
    <svg viewBox="0 0 48 56" fill="none" className="size-full overflow-visible">
      <defs>
        <linearGradient id={bodyFill} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#9ca3af" />
          <stop offset="0.55" stopColor="#6b7280" />
          <stop offset="1" stopColor="#4b5563" />
        </linearGradient>
        <linearGradient id={lidFill} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#b4bac3" />
          <stop offset="1" stopColor="#7b8390" />
        </linearGradient>
      </defs>

      {/* Wheels, behind the body. */}
      {[12, 36].map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy={50.5} r={4.25} fill="#1f2937" stroke="#0b1220" strokeWidth={0.75} />
          <circle cx={cx} cy={50.5} r={1.5} fill="#6b7280" />
        </g>
      ))}

      {/* Paper sticking out, behind the lid. */}
      <AnimatePresence>
        {sheets.map((s, i) => (
          <motion.g
            key={i}
            initial={{ y: 6, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 6, opacity: 0 }}
            transition={{ type: "spring", stiffness: 420, damping: 20 }}
          >
            <rect
              x={s.x}
              y={s.y}
              width={s.w}
              height={s.h}
              rx={0.6}
              fill="#f8fafc"
              stroke="#94a3b8"
              strokeWidth={0.5}
              transform={`rotate(${s.rotate} ${s.x + s.w / 2} ${s.y + s.h / 2})`}
            />
            <path
              d={`M${s.x + 1.8} ${s.y + 2.5}h${s.w - 3.6}M${s.x + 1.8} ${s.y + 4.5}h${s.w - 4.6}`}
              stroke="#cbd5e1"
              strokeWidth={0.6}
              strokeLinecap="round"
              transform={`rotate(${s.rotate} ${s.x + s.w / 2} ${s.y + s.h / 2})`}
            />
          </motion.g>
        ))}
      </AnimatePresence>

      {/* Opening, seen when the lid lifts. */}
      <rect x={7} y={12} width={34} height={3} rx={1} fill="#1f2937" />

      {/* Body, tapering to the wheels. */}
      <path
        d="M6.5 15h35l-3.1 32.6a2.6 2.6 0 0 1-2.6 2.4H12.2a2.6 2.6 0 0 1-2.6-2.4L6.5 15Z"
        fill={`url(#${bodyFill})`}
      />
      <rect x={9.5} y={19} width={2.25} height={26} rx={1.1} fill="#fff" opacity={0.22} />
      <rect x={5.5} y={13.5} width={37} height={3.5} rx={1.4} fill="#4b5563" />

      <text
        x={24}
        y={25.5}
        textAnchor="middle"
        fill="#fff"
        fontSize={5.4}
        fontWeight={700}
        letterSpacing={0.5}
        fontFamily="inherit"
      >
        PAPER
      </text>

      {/* Recycle mark (lucide's, scaled into the body). */}
      <g
        transform="translate(16.5 28.5) scale(0.625)"
        stroke="#fff"
        strokeWidth={2.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M7 19H4.815a1.83 1.83 0 0 1-1.57-.881 1.785 1.785 0 0 1-.004-1.784L7.196 9.5" />
        <path d="M11 19h8.203a1.83 1.83 0 0 0 1.556-.89 1.784 1.784 0 0 0 0-1.775l-1.226-2.12" />
        <path d="m14 16-3 3 3 3" />
        <path d="M8.293 13.596 7.196 9.5 3.1 10.598" />
        <path d="m9.344 5.811 1.093-1.892A1.83 1.83 0 0 1 11.985 3a1.784 1.784 0 0 1 1.546.888l3.943 6.843" />
        <path d="m13.378 9.633 4.096 1.098 1.097-4.096" />
      </g>

      {/* Lid, hinged at its left end. */}
      <motion.g
        initial={false}
        animate={{ rotate: lid, y: over ? -1 : 0 }}
        transition={{ type: "spring", stiffness: 380, damping: over ? 12 : 18 }}
        style={{ originX: 0.02, originY: 1 }}
      >
        <rect x={19} y={6.5} width={10} height={3} rx={1.2} fill="#4b5563" />
        <path
          d="M4 13.5c0-2.2 1.6-4.1 3.8-4.4C13 8.4 18.5 8 24 8s11 .4 16.2 1.1c2.2.3 3.8 2.2 3.8 4.4H4Z"
          fill={`url(#${lidFill})`}
        />
        <rect x={3.5} y={12.5} width={41} height={2} rx={1} fill="#5b6472" />
      </motion.g>
    </svg>
  );
}
