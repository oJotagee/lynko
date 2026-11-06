import type { SocialPlatform } from '@/app/[locale]/_components/social-links/social-link-schema'
import { socialPlatforms } from '@/app/[locale]/_components/social-links/social-platforms'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { AnalyticsOverview } from '../_data-access/get-analytics-overview'
import type { AnalyticsSocialItem } from '../_data-access/get-analytics-social'

export const numberFormat = new Intl.NumberFormat('pt-BR')

const percent = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 })

export function formatPercent(value: number) {
  return `${percent.format(value)}%`
}

interface StatCardProps {
  label: string
  value: string
  hint?: string
}

export function StatCard({ label, value, hint }: StatCardProps) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="text-[11px] font-normal tracking-[0.14em] text-muted-foreground uppercase">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold tabular-nums">{value}</p>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  )
}

interface OverviewCardsProps {
  overview: AnalyticsOverview
  social: AnalyticsSocialItem[]
}

export function OverviewCards({ overview, social }: OverviewCardsProps) {
  const top = social[0]

  const topName = top
    ? (socialPlatforms[top.platform as SocialPlatform]?.name ?? top.platform)
    : '—'

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatCard label="Visualizações" value={numberFormat.format(overview.pageViews)} />
      <StatCard label="Cliques totais" value={numberFormat.format(overview.totalClicks)} />
      <StatCard label="CTR" value={formatPercent(overview.ctr)} />
      <StatCard
        label="Rede mais clicada"
        value={topName}
        hint={top ? `${formatPercent(top.share)} dos cliques em redes` : 'Sem cliques em redes'}
      />
    </div>
  )
}
