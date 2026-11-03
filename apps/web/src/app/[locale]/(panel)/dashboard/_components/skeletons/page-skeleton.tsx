import { PreviewSkeleton } from './profile-preview-skeleton'
import { FormSkeleton } from './profile-form-skeleton'
import { Skeleton } from '@/components/ui/skeleton'
import { LinksSkeleton } from './links-skeleton'

export function PageSkeleton({ section }: { section: string }) {
  if (section === 'settings')
    return (
      <div className="max-w-4xl space-y-5">
        <div className="flex gap-5 border-b border-border pb-4">
          {[1, 2, 3].map((id) => (
            <Skeleton key={id} className="h-4 w-20" />
          ))}
        </div>
        <FormSkeleton />
        <Skeleton className="h-36 w-full rounded-xl" />
      </div>
    )

  if (section === 'appearance')
    return (
      <div className="space-y-5">
        <div className="flex flex-wrap justify-between gap-4">
          <Skeleton className="h-4 w-72 max-w-full" />
          <Skeleton className="h-11 w-40" />
        </div>
        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(310px,0.8fr)]">
          <div className="space-y-5">
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
            <FormSkeleton />
          </div>
          <PreviewSkeleton />
        </div>
      </div>
    )

  if (section === 'links')
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

  if (section === 'analytics')
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

  return (
    <div className="space-y-6">
      <Skeleton className="h-72 w-full rounded-2xl" />
      <div className="grid grid-cols-2 overflow-hidden rounded-xl border border-border bg-card">
        {[1, 2].map((id) => (
          <div key={id} className="space-y-5 p-6">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-9 w-16" />
          </div>
        ))}
      </div>
      <div className="grid items-start gap-5 xl:grid-cols-[1.5fr_1fr]">
        <LinksSkeleton />
        <PreviewSkeleton />
      </div>
    </div>
  )
}
