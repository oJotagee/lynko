'use client'

import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import type { AnalyticsPeriod } from '../_data-access/analytics-period'
import { getAnalyticsLinks } from '../_data-access/get-analytics-links'
import { getAnalyticsOverview } from '../_data-access/get-analytics-overview'
import { getAnalyticsSocial } from '../_data-access/get-analytics-social'
import { getAnalyticsTimeseries } from '../_data-access/get-analytics-timeseries'
import { AnalyticsEmpty } from './analytics-empty'
import { AnalyticsError } from './analytics-error'
import { AnalyticsSkeleton } from './analytics-skeleton'
import { OverviewCards } from './overview-cards'
import { PeriodFilter } from './period-filter'
import { SocialPerformance } from './social-performance'
import { TimeseriesChart } from './timeseries-chart'
import { TopLinks } from './top-links'

const staleTime = 60_000

export function Analytics() {
  const [period, setPeriod] = useState<AnalyticsPeriod>('7d')

  const overview = useQuery({
    queryKey: ['analytics', 'overview', period],
    queryFn: () => getAnalyticsOverview(period),
    staleTime,
  })

  const timeseries = useQuery({
    queryKey: ['analytics', 'timeseries', period],
    queryFn: () => getAnalyticsTimeseries(period),
    staleTime,
  })

  const links = useQuery({
    queryKey: ['analytics', 'links', period],
    queryFn: () => getAnalyticsLinks(period),
    staleTime,
  })

  const social = useQuery({
    queryKey: ['analytics', 'social', period],
    queryFn: () => getAnalyticsSocial(period),
    staleTime,
  })

  const queries = [overview, timeseries, links, social]

  const retry = () => {
    for (const query of queries) if (query.isError) void query.refetch()
  }

  function renderBody() {
    if (queries.some((query) => query.isError)) return <AnalyticsError onRetry={retry} />

    if (!overview.data || !timeseries.data || !links.data || !social.data) {
      return <AnalyticsSkeleton />
    }

    if (overview.data.pageViews === 0 && overview.data.totalClicks === 0) return <AnalyticsEmpty />

    return (
      <>
        <OverviewCards overview={overview.data} />
        <TimeseriesChart data={timeseries.data} />
        <div className="grid gap-3 lg:grid-cols-2">
          <TopLinks links={links.data} />
          <SocialPerformance items={social.data} />
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
