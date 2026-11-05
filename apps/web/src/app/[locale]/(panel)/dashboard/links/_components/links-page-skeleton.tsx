import { Skeleton } from '@/components/ui/skeleton'
import { LinksSkeleton } from '../../_components/skeletons/links-skeleton'
import { PreviewSkeleton } from '../../_components/skeletons/profile-preview-skeleton'

export function LinksPageSkeleton() {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap justify-between gap-4">
        <Skeleton className="h-4 w-80 max-w-full" />
        <Skeleton className="h-11 w-36" />
      </div>
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_310px]">
        <LinksSkeleton />
        <PreviewSkeleton />
      </div>
    </div>
  )
}
