import { Skeleton } from '@/components/ui/skeleton'

export function AnalyticsSkeleton() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-4 w-80 max-w-full" />
      <div className="space-y-4 rounded-xl border border-border bg-card p-6">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-8 w-20" />
      </div>
      <div className="space-y-5 rounded-xl border border-border bg-card p-8 sm:p-12">
        <Skeleton className="size-10" />
        <Skeleton className="h-7 w-80 max-w-full" />
        <Skeleton className="h-12 w-full max-w-xl" />
        <Skeleton className="h-9 w-52" />
      </div>
    </div>
  )
}
