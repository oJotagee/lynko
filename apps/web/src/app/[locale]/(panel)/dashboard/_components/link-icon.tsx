import { Link2 } from 'lucide-react'

import { cn } from '@/lib/utils'
import { getLinkBrand } from './link-brand'

interface LinkIconProps {
  url: string
  className: string
  iconClassName: string
  fallbackColor?: string
}

export function LinkIcon({ url, className, iconClassName, fallbackColor }: LinkIconProps) {
  const brand = getLinkBrand(url)
  const Icon = brand?.icon ?? Link2

  return (
    <span
      className={cn('flex shrink-0 items-center justify-center rounded-lg', className)}
      style={brand ? { background: brand.color, color: '#ffffff' } : { background: fallbackColor }}
    >
      <Icon className={iconClassName} aria-hidden="true" />
    </span>
  )
}
