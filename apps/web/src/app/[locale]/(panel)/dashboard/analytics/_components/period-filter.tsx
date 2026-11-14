'use client'

import { Lock } from 'lucide-react'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useRouter } from '@/i18n/navigation'
import { ANALYTICS_PERIODS, type AnalyticsPeriod } from '../_data-access/analytics-period'

const labels: Record<AnalyticsPeriod, string> = {
  '7d': '7 dias',
  '30d': '30 dias',
  '90d': '90 dias',
}

const PRO_PERIODS: AnalyticsPeriod[] = ['90d']

interface PeriodFilterProps {
  value: AnalyticsPeriod
  onChange: (period: AnalyticsPeriod) => void
  isPro: boolean
}

export function PeriodFilter({ value, onChange, isPro }: PeriodFilterProps) {
  const router = useRouter()

  return (
    <ToggleGroup
      aria-label="Período"
      variant="outline"
      spacing={0}
      value={[value]}
      onValueChange={(values) => {
        const next = values[0] as AnalyticsPeriod | undefined

        if (!next) return

        if (!isPro && PRO_PERIODS.includes(next)) {
          router.push('/dashboard/plans')

          return
        }

        onChange(next)
      }}
    >
      {ANALYTICS_PERIODS.map((period) => {
        const locked = !isPro && PRO_PERIODS.includes(period)

        return (
          <ToggleGroupItem
            key={period}
            value={period}
            aria-label={locked ? `${labels[period]}, exclusivo do Pro` : undefined}
          >
            {locked && <Lock className="size-3.5" aria-hidden />}
            {labels[period]}
          </ToggleGroupItem>
        )
      })}
    </ToggleGroup>
  )
}
