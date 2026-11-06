import { Plus } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'
import type { DashboardData } from '../dashboard-data'
import { DashboardMascot } from '../layout/dashboard-mascot'
import { OverviewAnalytics } from './overview-analytics'
import { YourLinks } from './your-links'

export function Overview({ data, hasPage }: { data: DashboardData; hasPage: boolean }) {
  return (
    <div className="space-y-6">
      <section className="relative isolate flex min-h-56 items-center overflow-hidden rounded-2xl border border-foreground/40 bg-accent px-6 py-8 text-accent-foreground sm:px-9">
        <div className="relative z-10 max-w-xl pr-10 sm:pr-28">
          <h2 className="text-3xl leading-tight font-bold tracking-tight sm:text-4xl">
            Seu mundo merece
            <br />
            ser encontrado.
          </h2>
          <p className="mt-4 max-w-sm text-sm leading-relaxed">
            Seu próximo projeto, uma boa conversa, uma nova conexão. Tudo começa com um link.
          </p>
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
        </div>
        <DashboardMascot className="absolute -right-9 -bottom-4 w-40 sm:right-5 sm:w-56 lg:w-64" />
      </section>
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
