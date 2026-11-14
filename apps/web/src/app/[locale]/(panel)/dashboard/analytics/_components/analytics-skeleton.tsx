import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

const STAT_CARDS = [0, 1, 2, 3]

const RANKING_ROWS = [0, 1, 2]

export function PeriodFilterSkeleton() {
  return <Skeleton className="h-9 w-48 rounded-lg" />
}

export function StatCardsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {STAT_CARDS.map((item) => (
        <Card key={item} size="sm">
          <CardHeader>
            <Skeleton className="h-3 w-24" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-9 w-16" />
            <Skeleton className="mt-1 h-3 w-28" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function ChartCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex-row flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-5 w-48" />
        </div>
        <Skeleton className="h-9 w-32 rounded-lg" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-64 w-full" />
      </CardContent>
    </Card>
  )
}

export function RankingCardSkeleton() {
  return (
    <Card>
      <CardHeader className="space-y-2">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-5 w-36" />
      </CardHeader>
      <CardContent>
        {RANKING_ROWS.map((row) => (
          <div key={row} className="flex items-center gap-3 py-3">
            <Skeleton className="h-3 w-5" />
            <Skeleton className="size-9 shrink-0 rounded-lg" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/3" />
            </div>
            <Skeleton className="hidden h-2 w-24 rounded-full sm:block" />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export function AnalyticsSkeleton() {
  return (
    <div className="space-y-5" role="status" aria-busy="true">
      <span className="sr-only">Carregando analytics…</span>
      <StatCardsSkeleton />
      <ChartCardSkeleton />
      <div className="grid gap-3 lg:grid-cols-2">
        <RankingCardSkeleton />
        <RankingCardSkeleton />
      </div>
    </div>
  )
}

export function AnalyticsPageSkeleton() {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Acompanhe as visitas e os cliques da sua página.
        </p>
        <PeriodFilterSkeleton />
      </div>
      <AnalyticsSkeleton />
    </div>
  )
}
