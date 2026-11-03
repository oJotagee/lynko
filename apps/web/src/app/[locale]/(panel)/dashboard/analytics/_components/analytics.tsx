import { ChartNoAxesColumn } from 'lucide-react'
import { Button } from '@/components/ui/button'

import type { DashboardLink } from '../../_components/dashboard-data'

export function Analytics({ links }: { links: DashboardLink[] }) {
  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Acompanhe as informações disponíveis sobre sua página.
      </p>
      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-base font-semibold">Links ativos</h2>
        <p className="mt-4 text-3xl font-bold">
          {links.filter((link) => link.active).length}
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            de {links.length} cadastrados
          </span>
        </p>
      </section>
      <section className="rounded-xl border border-border bg-card p-8 sm:p-12">
        <ChartNoAxesColumn className="mb-5 size-10 text-muted-foreground" />
        <h2 className="text-2xl font-bold">Analytics ainda não está disponível</h2>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
          A API atual não fornece visualizações, cliques, histórico, origem do tráfego ou
          dispositivos. Esses números serão exibidos quando a integração estiver disponível.
        </p>
        <fieldset
          className="mt-6 flex flex-wrap gap-2"
          aria-label="Filtros de período indisponíveis"
        >
          {[7, 30, 90].map((days) => (
            <Button key={days} variant="outline" disabled>
              {days} dias
            </Button>
          ))}
        </fieldset>
      </section>
    </div>
  )
}
