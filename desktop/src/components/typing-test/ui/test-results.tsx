import { ChevronRight, Crown, RotateCcw } from 'lucide-react'
import { motion } from 'motion/react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { TypingResult } from '@/types/typing-test'
import { WpmChart } from './wpm-chart'

interface TestResultsProps {
  result: TypingResult
  onNext: () => void
  onRepeat: () => void
}

const testLabel = ({ mode, amount, punctuation, numbers }: TypingResult['config']) =>
  [mode === 'time' ? `time ${amount}` : `words ${amount}`, 'english', punctuation && 'punctuation', numbers && 'numbers']
    .filter(Boolean)
    .join(' · ')

/** A small label over a big yellow number. */
function Stat({ label, value, hint, big = false }: { label: string; value: string; hint?: string; big?: boolean }) {
  const body = (
    <div className="flex flex-col">
      <span className={big ? 'text-2xl text-muted-foreground' : 'text-[13px] text-muted-foreground'}>{label}</span>
      <span className={big ? 'text-6xl leading-none font-semibold text-score tabular-nums' : 'text-2xl leading-tight text-score tabular-nums'}>
        {value}
      </span>
    </div>
  )
  if (!hint) return body
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="cursor-default">{body}</div>
      </TooltipTrigger>
      <TooltipContent>{hint}</TooltipContent>
    </Tooltip>
  )
}

/** Results of a finished test: wpm and accuracy up front, the chart, then the detail row. */
export function TestResults({ result, onNext, onRepeat }: TestResultsProps) {
  const { chars } = result
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="flex flex-col gap-8 font-mono"
    >
      <div className="grid gap-8 md:grid-cols-[auto_1fr] md:items-start">
        <div className="flex gap-10 md:flex-col md:gap-6">
          <div className="flex flex-col gap-2">
            <Stat big label="wpm" value={String(Math.round(result.wpm))} hint={`${result.wpm.toFixed(2)} wpm`} />
            {result.personalBest && (
              <motion.span
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 18, delay: 0.2 }}
                className="flex w-fit items-center gap-1 rounded-full bg-score/15 px-2 py-0.5 text-[11px] font-medium text-score"
              >
                <Crown className="size-3" /> new personal best
              </motion.span>
            )}
          </div>
          <Stat
            big
            label="acc"
            value={`${Math.round(result.accuracy)}%`}
            hint={`${result.accuracy.toFixed(2)}% · ${chars.correct} correct, ${chars.incorrect + chars.extra} wrong`}
          />
        </div>
        <WpmChart history={result.history} />
      </div>

      <div className="flex flex-wrap gap-x-10 gap-y-4">
        <div className="flex flex-col">
          <span className="text-[13px] text-muted-foreground">test type</span>
          <span className="text-[13px] text-score">{testLabel(result.config)}</span>
        </div>
        <Stat label="raw" value={String(Math.round(result.raw))} hint={`${result.raw.toFixed(2)} wpm, mistakes included`} />
        <Stat
          label="characters"
          value={`${chars.correct}/${chars.incorrect}/${chars.extra}/${chars.missed}`}
          hint="correct / incorrect / extra / missed"
        />
        <Stat label="consistency" value={`${Math.round(result.consistency)}%`} hint="How even your pace was, second to second" />
        <Stat label="time" value={`${Math.round(result.seconds)}s`} hint={`${result.seconds.toFixed(2)}s`} />
      </div>

      <div className="flex justify-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Next test" onClick={onNext}>
              <ChevronRight />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Next test · Tab</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Repeat test" onClick={onRepeat}>
              <RotateCcw />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Repeat these words</TooltipContent>
        </Tooltip>
      </div>
    </motion.section>
  )
}
