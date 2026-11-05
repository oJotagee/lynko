'use client'

import { ExternalLink } from 'lucide-react'

import { Button, buttonVariants } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Link } from '@/i18n/navigation'
import type { DashboardProfile } from '../dashboard-data'

const label = <span className="hidden sm:inline">Ver página</span>

export function PreviewPageButton({ profile }: { profile: DashboardProfile }) {
  if (!profile.published || !profile.username) {
    return (
      <Tooltip>
        <TooltipTrigger render={<span className="rounded-lg" />}>
          <Button
            variant="outline"
            className="h-11 gap-2 px-3"
            disabled
            aria-label="Ver página, publique sua página para vê-la"
          >
            <ExternalLink />
            {label}
          </Button>
        </TooltipTrigger>
        <TooltipContent>Publique sua página para vê-la</TooltipContent>
      </Tooltip>
    )
  }

  return (
    <Link
      href={`/${profile.username}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Ver página pública em nova aba"
      className={buttonVariants({ variant: 'outline', className: 'h-11 gap-2 px-3' })}
    >
      <ExternalLink />
      {label}
    </Link>
  )
}
