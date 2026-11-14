import { Skeleton } from '@/components/ui/skeleton'

const ROWS = [0, 1, 2]

export function YourLinksSkeleton() {
  return (
    <section className="rounded-xl border border-border bg-card p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">Seus links</h2>
        <Skeleton className="h-3 w-16" />
      </div>
      <div className="mt-4">
        {ROWS.map((row) => (
          <div key={row} className="flex items-center gap-3 border-t border-border py-4">
            <Skeleton className="size-9 shrink-0 rounded-lg" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function RowActionsSkeleton() {
  return (
    <div className="flex items-center justify-between border-t border-border pt-3 sm:w-auto sm:justify-end sm:gap-1 sm:border-0 sm:pt-0">
      <div className="flex size-11 items-center justify-center">
        <Skeleton className="size-4" />
      </div>
      <div className="flex size-11 items-center justify-center">
        <Skeleton className="size-4" />
      </div>
      <div className="flex size-11 items-center justify-center">
        <Skeleton className="h-5 w-8 rounded-full" />
      </div>
      <div className="flex size-11 items-center justify-center">
        <Skeleton className="size-4" />
      </div>
      <div className="flex size-11 items-center justify-center">
        <Skeleton className="size-4" />
      </div>
    </div>
  )
}

export function LinkRowsSkeleton({ rows, draggable }: { rows: number; draggable?: boolean }) {
  return (
    <div className="grid gap-3 sm:block sm:overflow-hidden sm:rounded-xl sm:border sm:border-border sm:bg-card">
      {ROWS.slice(0, rows).map((row) => (
        <div
          key={row}
          className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:flex-wrap sm:items-center sm:rounded-none sm:border-0 sm:border-t sm:px-5 sm:py-5 sm:first:border-t-0"
        >
          {draggable && (
            <div className="hidden size-9 items-center justify-center sm:flex">
              <Skeleton className="h-4 w-2.5" />
            </div>
          )}
          <div className="flex min-w-0 items-center gap-3 sm:flex-1 sm:basis-24">
            <Skeleton className="size-10 shrink-0 rounded-lg" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48 max-w-full" />
            </div>
          </div>
          <RowActionsSkeleton />
        </div>
      ))}
    </div>
  )
}
