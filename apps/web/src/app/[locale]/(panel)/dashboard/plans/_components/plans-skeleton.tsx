import { Skeleton } from '@/components/ui/skeleton'

const FEATURES = [0, 1, 2, 3, 4]

function CardSkeleton({ dark }: { dark?: boolean }) {
  const tone = dark ? 'bg-sidebar-accent' : undefined

  return (
    <div
      className={
        dark
          ? 'rounded-2xl bg-sidebar p-6 sm:p-8'
          : 'rounded-2xl border border-border bg-card p-6 sm:p-8'
      }
    >
      <Skeleton className={`h-3 w-14 ${tone ?? ''}`} />
      <Skeleton className={`mt-4 h-6 w-48 ${tone ?? ''}`} />
      <Skeleton className={`mt-6 h-9 w-36 ${tone ?? ''}`} />
      <Skeleton className={`mt-6 h-4 w-full ${tone ?? ''}`} />
      <Skeleton className={`mt-8 h-12 w-full rounded-[10px] ${tone ?? ''}`} />
      <div className="mt-6 space-y-4 pt-6">
        {FEATURES.map((item) => (
          <Skeleton key={item} className={`h-4 w-3/4 ${tone ?? ''}`} />
        ))}
      </div>
    </div>
  )
}

export function PlansSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="max-w-xl">
          <h2 className="text-2xl leading-tight font-bold tracking-tight sm:text-3xl">
            Um plano simples para
            <span className="block text-accent">onde você quiser chegar.</span>
          </h2>
          <p className="mt-4 text-sm text-muted-foreground">
            Comece com tudo o que precisa. Assine o Pro quando quiser mais dados e uma página só
            sua.
          </p>
        </div>
        <Skeleton className="h-[50px] w-[265px] rounded-xl" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <CardSkeleton />
        <CardSkeleton dark />
      </div>
      <Skeleton className="h-80 w-full rounded-2xl" />
    </div>
  )
}
