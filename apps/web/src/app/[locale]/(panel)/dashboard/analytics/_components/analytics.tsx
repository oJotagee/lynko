'use client'

import { useState } from 'react'

import type { AnalyticsPeriod } from '../_data-access/analytics-period'
import { AnalyticsEmpty } from './analytics-empty'
import { AnalyticsError } from './analytics-error'
import { AnalyticsSkeleton } from './analytics-skeleton'
import { OverviewCards } from './overview-cards'
import { PeriodFilter } from './period-filter'
import { SocialPerformance } from './social-performance'
import { TimeseriesChart } from './timeseries-chart'
import { TopLinks } from './top-links'
import { useAnalytics } from './use-analytics'

export function Analytics() {
  const [period, setPeriod] = useState<AnalyticsPeriod>('7d')

  const { overview, timeseries, links, social, isError, retry } = useAnalytics(period)

  function renderBody() {
    if (isError) return <AnalyticsError onRetry={retry} />

    if (!overview || !timeseries || !links || !social) return <AnalyticsSkeleton />

    if (overview.pageViews === 0 && overview.totalClicks === 0) return <AnalyticsEmpty />

    return (
      <>
        <OverviewCards overview={overview} social={social} />
        <TimeseriesChart data={timeseries} />
        <div className="grid gap-3 lg:grid-cols-2">
          <TopLinks links={links} />
          <SocialPerformance items={social} />
        </div>
      </>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Acompanhe as visitas e os cliques da sua página.
        </p>
        <PeriodFilter value={period} onChange={setPeriod} />
      </div>
      {renderBody()}
    </div>
  )
}
