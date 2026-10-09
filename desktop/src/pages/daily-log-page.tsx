import { DailyLog } from '@/components/daily-log/daily-log'

interface DailyLogPageProps {
  onOpenSettings: () => void
  onOpenTypingTest: () => void
}

export function DailyLogPage({ onOpenSettings, onOpenTypingTest }: DailyLogPageProps) {
  return (
    <main className="min-h-dvh bg-muted/40 lg:h-dvh lg:overflow-y-auto">
      <DailyLog onOpenSettings={onOpenSettings} onOpenTypingTest={onOpenTypingTest} />
    </main>
  )
}
