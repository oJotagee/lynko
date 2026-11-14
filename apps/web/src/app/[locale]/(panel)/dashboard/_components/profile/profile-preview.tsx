'use client'

import { PageView } from '@/app/[locale]/_components/page-view/page-view'
import { useNow } from '@/hooks/use-now'
import { cn } from '@/lib/utils'
import type { DashboardData } from '../dashboard-data'
import { getLinkStatus } from '../link-status'

export type PreviewMode = 'mobile' | 'desktop'

interface ProfilePreviewProps {
  data: DashboardData
  mode?: PreviewMode
}

export function ProfilePreview({
  data: { profile, appearance, backgroundImageUrl, socialLinks, links },
  mode = 'mobile',
}: ProfilePreviewProps) {
  const now = useNow()

  return (
    <div
      className={cn(
        'mx-auto w-full overflow-hidden border border-foreground/60 shadow-xl motion-safe:transition-[max-width]',
        mode === 'mobile' ? 'max-w-[280px] rounded-[34px]' : 'max-w-[640px] rounded-xl',
      )}
    >
      <PageView
        profile={profile}
        appearance={appearance}
        backgroundImageUrl={backgroundImageUrl}
        socialLinks={socialLinks}
        links={links.filter((link) => getLinkStatus(link, now ?? new Date()) === 'live')}
        className="min-h-[420px]"
      />
    </div>
  )
}
