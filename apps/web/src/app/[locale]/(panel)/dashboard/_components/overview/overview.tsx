import { Plus } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'
import type { DashboardData } from '../dashboard-data'
import { OverviewAnalytics } from './overview-analytics'
import { OverviewHero } from './overview-hero'
import { YourLinks } from './your-links'

export function Overview({ data, hasPage }: { data: DashboardData; hasPage: boolean }) {
  return (
    <div className="space-y-6">
      <OverviewHero
        action={
          <Link
            href={hasPage ? '/dashboard/links?new=1' : '/dashboard/settings'}
            className={buttonVariants({
              variant: 'outline',
              className: 'mt-6 min-h-11 bg-card px-4 text-foreground',
            })}
          >
            {hasPage ? 'Adicionar um link' : 'Criar minha página'}
            <Plus className="ml-2 size-4" />
          </Link>
        }
      />
      {hasPage ? (
        <OverviewAnalytics
          activeLinks={data.links.filter((link) => link.active).length}
          totalLinks={data.links.length}
        >
          <YourLinks links={data.links} />
        </OverviewAnalytics>
      ) : (
        <YourLinks links={data.links} />
      )}
    </div>
  )
}
