'use client'

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

export type Cycle = 'monthly' | 'annually'

interface CycleToggleProps {
  value: Cycle
  onChange: (cycle: Cycle) => void
  savingPercent: number
}

const itemClass =
  'min-h-10 rounded-lg px-4 text-sm text-muted-foreground hover:bg-card/60 aria-pressed:bg-card aria-pressed:text-foreground aria-pressed:shadow-xs'

export function CycleToggle({ value, onChange, savingPercent }: CycleToggleProps) {
  return (
    <ToggleGroup
      aria-label="Cobrança"
      spacing={1}
      className="rounded-xl border border-border bg-muted p-1"
      value={[value]}
      onValueChange={(values) => {
        const next = values[0]

        if (next === 'monthly' || next === 'annually') onChange(next)
      }}
    >
      <ToggleGroupItem value="monthly" className={itemClass}>
        Mensal
      </ToggleGroupItem>
      <ToggleGroupItem value="annually" className={`${itemClass} gap-2`}>
        Anual
        {savingPercent > 0 && (
          <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] text-secondary-foreground">
            Economize {savingPercent}%
          </span>
        )}
      </ToggleGroupItem>
    </ToggleGroup>
  )
}
