import { ChartNoAxesColumn } from 'lucide-react'

export function AnalyticsEmpty() {
  return (
    <section className="rounded-xl border border-border bg-card p-8 text-center sm:p-12">
      <ChartNoAxesColumn
        className="mx-auto mb-4 size-10 text-muted-foreground"
        aria-hidden="true"
      />
      <h2 className="text-lg font-semibold">Ainda não há visitas nem cliques neste período</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        Divulgue o link da sua página. Os números aparecem aqui assim que alguém visitar ou clicar.
      </p>
    </section>
  )
}
