import { Skeleton } from '@/components/ui/skeleton'
import { PreviewSkeleton } from '../../_components/skeletons/profile-preview-skeleton'

export function AppearanceSkeleton() {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap justify-between gap-4">
        <Skeleton className="h-4 w-72 max-w-full" />
        <Skeleton className="h-11 w-40" />
      </div>
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(310px,0.8fr)]">
        <div className="space-y-5 rounded-xl border border-border bg-card p-6">
          <Skeleton className="h-6 w-40" />
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((id) => (
              <Skeleton key={id} className="h-32 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-11 w-full" />
        </div>
        <PreviewSkeleton />
      </div>
    </div>
  )
}
