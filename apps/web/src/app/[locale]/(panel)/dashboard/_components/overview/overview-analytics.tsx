'use client'

import { type ReactNode, useState } from 'react'

import { AnalyticsError } from '../../analytics/_components/analytics-error'
import { AnalyticsSkeleton } from '../../analytics/_components/analytics-skeleton'
import { formatPercent, numberFormat, StatCard } from '../../analytics/_components/overview-cards'
import { PeriodFilter } from '../../analytics/_components/period-filter'
import { TimeseriesChart } from '../../analytics/_components/timeseries-chart'
import { TopLinks } from '../../analytics/_components/top-links'
import { useAnalytics } from '../../analytics/_components/use-analytics'
import type { AnalyticsPeriod } from '../../analytics/_data-access/analytics-period'

interface OverviewAnalyticsProps {
  activeLinks: number
  totalLinks: number
  children: ReactNode
}

export function OverviewAnalytics({ activeLinks, totalLinks, children }: OverviewAnalyticsProps) {
  const [period, setPeriod] = useState<AnalyticsPeriod>('7d')

  const { overview, timeseries, links, isError, retry } = useAnalytics(period)

  function renderBody() {
    if (isError || !overview || !timeseries || !links) {
      return (
        <>
          {isError ? <AnalyticsError onRetry={retry} /> : <AnalyticsSkeleton />}
          {children}
        </>
      )
    }

    return (
      <>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="Visualizações" value={numberFormat.format(overview.pageViews)} />
          <StatCard label="Cliques em links" value={numberFormat.format(overview.linkClicks)} />
          <StatCard label="CTR" value={formatPercent(overview.ctr)} />
          <StatCard
            label="Links ativos"
            value={String(activeLinks)}
            hint={`de ${totalLinks} cadastrados`}
          />
        </div>
        <div className="grid items-start gap-5 xl:grid-cols-[1.5fr_1fr]">
          <TimeseriesChart data={timeseries} />
          <div className="space-y-5">
            <TopLinks links={links.slice(0, 5)} />
            {children}
          </div>
        </div>
      </>
    )
  }

  return (
    <section className="space-y-5" aria-labelledby="overview-analytics-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="overview-analytics-title" className="text-lg font-semibold">
          Visão geral
        </h2>
        <PeriodFilter value={period} onChange={setPeriod} />
      </div>
      {renderBody()}
    </section>
  )
}
