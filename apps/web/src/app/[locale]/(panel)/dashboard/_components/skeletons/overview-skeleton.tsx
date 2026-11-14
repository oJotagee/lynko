import type { ReactNode } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import {
  ChartCardSkeleton,
  PeriodFilterSkeleton,
  RankingCardSkeleton,
  StatCardsSkeleton,
} from '../../analytics/_components/analytics-skeleton'
import { OverviewHero } from '../overview/overview-hero'
import { YourLinksSkeleton } from './links-skeleton'

export function OverviewBodySkeleton({ aside }: { aside: ReactNode }) {
  return (
    <>
      <div role="status" aria-busy="true">
        <span className="sr-only">Carregando analytics…</span>
        <StatCardsSkeleton />
      </div>
      <div className="grid items-start gap-5 xl:grid-cols-[1.5fr_1fr]">
        <ChartCardSkeleton />
        <div className="space-y-5">
          <RankingCardSkeleton />
          {aside}
        </div>
      </div>
    </>
  )
}

export function OverviewSkeleton() {
  return (
    <div className="space-y-6">
      <OverviewHero action={<Skeleton className="mt-6 h-11 w-44 rounded-[10px] bg-card/70" />} />
      <section className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Visão geral</h2>
          <PeriodFilterSkeleton />
        </div>
        <OverviewBodySkeleton aside={<YourLinksSkeleton />} />
      </section>
    </div>
  )
}
