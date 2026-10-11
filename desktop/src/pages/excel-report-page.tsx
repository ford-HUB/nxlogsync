import { motion } from 'motion/react'
import { useEffect } from 'react'
import { ExcelReport } from '@/components/excel-report/excel-report'

interface ExcelReportPageProps {
  onBack: () => void
}

/** The Excel report as the next page: it slides in from the right over the daily log, and back out on close or Escape. */
export function ExcelReportPage({ onBack }: ExcelReportPageProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onBack()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onBack])

  return (
    <motion.main
      role="dialog"
      aria-modal="true"
      aria-label="Excel report"
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'tween', ease: [0.32, 0.72, 0, 1], duration: 0.35 }}
      className="fixed inset-0 z-50 overflow-y-auto bg-background shadow-2xl"
    >
      <ExcelReport onBack={onBack} />
    </motion.main>
  )
}
