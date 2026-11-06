import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { ANALYTICS_PERIODS, type AnalyticsPeriod } from '../_data-access/analytics-period'

const labels: Record<AnalyticsPeriod, string> = {
  '7d': '7 dias',
  '30d': '30 dias',
  '90d': '90 dias',
}

interface PeriodFilterProps {
  value: AnalyticsPeriod
  onChange: (period: AnalyticsPeriod) => void
}

export function PeriodFilter({ value, onChange }: PeriodFilterProps) {
  return (
    <ToggleGroup
      aria-label="Período"
      variant="outline"
      spacing={0}
      value={[value]}
      onValueChange={(values) => {
        const next = values[0]

        if (next) onChange(next as AnalyticsPeriod)
      }}
    >
      {ANALYTICS_PERIODS.map((period) => (
        <ToggleGroupItem key={period} value={period}>
          {labels[period]}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
