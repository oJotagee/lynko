import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { AnalyticsOverview } from '../_data-access/get-analytics-overview'

const number = new Intl.NumberFormat('pt-BR')

const percent = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 })

export function OverviewCards({ overview }: { overview: AnalyticsOverview }) {
  const items = [
    { label: 'Visualizações', value: number.format(overview.pageViews) },
    { label: 'Cliques totais', value: number.format(overview.totalClicks) },
    { label: 'CTR', value: `${percent.format(overview.ctr)}%` },
    { label: 'Cliques em redes sociais', value: number.format(overview.socialClicks) },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map((item) => (
        <Card key={item.label} size="sm">
          <CardHeader>
            <CardTitle className="text-muted-foreground">{item.label}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums">{item.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
