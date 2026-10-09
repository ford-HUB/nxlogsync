import { AtSign, Clock, Hash, Type } from 'lucide-react'
import type { ReactNode } from 'react'
import { TIME_AMOUNTS, WORD_AMOUNTS } from '@/constants/typing-test'
import { cn } from '@/lib/utils'
import type { TypingConfig } from '@/types/typing-test'

interface TestConfigBarProps {
  config: TypingConfig
  onChange: (patch: Partial<TypingConfig>) => void
  /** Hidden while a test runs, like monkeytype. */
  hidden: boolean
}

function Option({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      // Keep focus on the typing input so the next key still types.
      onMouseDown={(e) => e.preventDefault()}
      className={cn(
        'flex items-center gap-1.5 rounded-md px-2 py-1 text-[12px] transition-colors',
        active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
      )}
    >
      {children}
    </button>
  )
}

const Divider = () => <span aria-hidden className="mx-1 h-4 w-px bg-border" />

/** One row of test settings: punctuation and numbers, the mode, then its length. */
export function TestConfigBar({ config, onChange, hidden }: TestConfigBarProps) {
  const amounts = config.mode === 'time' ? TIME_AMOUNTS : WORD_AMOUNTS
  return (
    <div
      className={cn(
        'mx-auto flex w-fit flex-wrap items-center justify-center rounded-lg bg-muted/60 px-2 py-1 font-mono transition-opacity duration-200',
        hidden && 'pointer-events-none opacity-0',
      )}
    >
      <Option active={config.punctuation} onClick={() => onChange({ punctuation: !config.punctuation })}>
        <AtSign className="size-3.5" /> punctuation
      </Option>
      <Option active={config.numbers} onClick={() => onChange({ numbers: !config.numbers })}>
        <Hash className="size-3.5" /> numbers
      </Option>
      <Divider />
      <Option active={config.mode === 'time'} onClick={() => config.mode !== 'time' && onChange({ mode: 'time', amount: 30 })}>
        <Clock className="size-3.5" /> time
      </Option>
      <Option active={config.mode === 'words'} onClick={() => config.mode !== 'words' && onChange({ mode: 'words', amount: 25 })}>
        <Type className="size-3.5" /> words
      </Option>
      <Divider />
      {amounts.map((n) => (
        <Option key={n} active={config.amount === n} onClick={() => onChange({ amount: n })}>
          <span className="tabular-nums">{n}</span>
        </Option>
      ))}
    </div>
  )
}
