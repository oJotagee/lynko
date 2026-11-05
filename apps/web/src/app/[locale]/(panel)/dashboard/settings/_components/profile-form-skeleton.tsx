import { Skeleton } from '@/components/ui/skeleton'

export function FormSkeleton() {
  return (
    <div className="space-y-7 rounded-xl border border-border bg-card p-6 sm:p-8">
      <Skeleton className="h-7 w-40" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="size-16 rounded-full" />
      {[1, 2, 3, 4].map((id) => (
        <div key={id} className="space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-11 w-full" />
        </div>
      ))}
      <Skeleton className="h-11 w-36" />
    </div>
  )
}
