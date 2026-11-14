import { Skeleton } from '@/components/ui/skeleton'
import { LinkRowsSkeleton } from '../../_components/skeletons/links-skeleton'
import { PreviewSkeleton } from '../../_components/skeletons/profile-preview-skeleton'

interface SectionSkeletonProps {
  title: string
  rows: number
  draggable?: boolean
}

function SectionSkeleton({ title, rows, draggable }: SectionSkeletonProps) {
  return (
    <section className="min-w-0 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-2">
          <h2 className="text-lg font-bold">{title}</h2>
          <Skeleton className="h-4 w-64 max-w-full" />
        </div>
        <Skeleton className="h-11 w-36 rounded-[10px]" />
      </div>
      <LinkRowsSkeleton rows={rows} draggable={draggable} />
    </section>
  )
}

export function LinksPageSkeleton() {
  return (
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_310px]">
      <div className="space-y-10">
        <SectionSkeleton title="Links" rows={3} draggable />
        <SectionSkeleton title="Redes sociais" rows={1} />
      </div>
      <aside className="rounded-xl bg-muted p-5">
        <h2 className="mb-5 text-center text-[10px] tracking-widest text-muted-foreground uppercase">
          Prévia ao vivo
        </h2>
        <PreviewSkeleton />
      </aside>
    </div>
  )
}
