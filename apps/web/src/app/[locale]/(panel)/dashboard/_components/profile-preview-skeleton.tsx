import { Skeleton } from '@/components/ui/skeleton'

export function PreviewSkeleton() {
  return (
    <div className="flex justify-center rounded-xl bg-muted p-6">
      <div className="flex min-h-96 w-full max-w-[280px] flex-col items-center gap-4 rounded-[34px] border border-border bg-card p-6">
        <Skeleton className="mt-5 size-16 rounded-full" />
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-3 w-20" />
        <Skeleton className="mb-5 h-10 w-full" />
        {[1, 2, 3].map((id) => (
          <Skeleton key={id} className="h-11 w-full rounded-full" />
        ))}
      </div>
    </div>
  )
}
