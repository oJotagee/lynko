import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

const colors = ['var(--chart-2)', 'var(--chart-1)', 'var(--chart-3)']

interface ShareBarProps {
  share: number
  index: number
  label: string
  className?: string
}

export function ShareBar({ share, index, label, className }: ShareBarProps) {
  return (
    <Progress
      value={share}
      aria-label={label}
      className={cn('[&_[data-slot=progress-indicator]]:bg-(--bar)', className)}
      style={{ '--bar': colors[index % colors.length] } as React.CSSProperties}
    />
  )
}
