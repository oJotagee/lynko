import { Skeleton } from '@/components/ui/skeleton'

export function PreviewSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[280px] overflow-hidden rounded-[34px] border border-foreground/60 shadow-xl">
      <div className="flex min-h-[420px] flex-col items-center gap-3 bg-card px-4 pt-9 pb-6">
        <Skeleton className="size-16 rounded-full" />
        <Skeleton className="mt-2 h-5 w-28" />
        <Skeleton className="h-3 w-20" />
        <Skeleton className="my-3 size-6 rounded-full" />
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="mt-auto h-3 w-24" />
      </div>
    </div>
  )
}
