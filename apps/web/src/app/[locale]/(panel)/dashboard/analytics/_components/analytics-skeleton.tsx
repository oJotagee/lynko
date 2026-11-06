import { Skeleton } from '@/components/ui/skeleton'

export function AnalyticsSkeleton() {
  return (
    <div className="space-y-5" role="status" aria-busy="true">
      <span className="sr-only">Carregando analytics…</span>
      <Skeleton className="h-4 w-80 max-w-full" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <Skeleton key={item} className="h-24 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-80 rounded-xl" />
      <div className="grid gap-3 lg:grid-cols-2">
        <Skeleton className="h-56 rounded-xl" />
        <Skeleton className="h-56 rounded-xl" />
      </div>
    </div>
  )
}
