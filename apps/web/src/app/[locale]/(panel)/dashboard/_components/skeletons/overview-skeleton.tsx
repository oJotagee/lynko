import { Skeleton } from '@/components/ui/skeleton'
import { LinksSkeleton } from './links-skeleton'

export function OverviewSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-72 w-full rounded-2xl" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[1, 2, 3, 4].map((id) => (
          <div key={id} className="space-y-5 rounded-xl border border-border bg-card p-6">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-9 w-16" />
          </div>
        ))}
      </div>
      <div className="grid items-start gap-5 xl:grid-cols-[1.5fr_1fr]">
        <Skeleton className="h-80 rounded-xl" />
        <LinksSkeleton />
      </div>
    </div>
  )
}
