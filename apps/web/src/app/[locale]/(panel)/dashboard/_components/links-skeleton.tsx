import { Skeleton } from '@/components/ui/skeleton'

export function LinksSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex justify-between p-5">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-3 w-28" />
      </div>
      {[1, 2, 3].map((id) => (
        <div key={id} className="flex flex-wrap items-center gap-4 border-t border-border p-5">
          <Skeleton className="size-10 shrink-0 rounded-lg" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <div className="ml-auto flex w-full justify-end gap-3 sm:w-auto">
            <Skeleton className="h-5 w-8 rounded-full" />
            <Skeleton className="size-5" />
            <Skeleton className="size-5" />
          </div>
        </div>
      ))}
    </div>
  )
}
