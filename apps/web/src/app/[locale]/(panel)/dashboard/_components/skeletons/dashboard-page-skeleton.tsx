import { Skeleton } from '@/components/ui/skeleton'
import { DashboardMenuButton } from '../layout/dashboard-menu-button'

interface DashboardPageSkeletonProps {
  title: string
  children: React.ReactNode
}

export function DashboardPageSkeleton({ title, children }: DashboardPageSkeletonProps) {
  return (
    <div role="status" aria-busy="true">
      <span className="sr-only">Carregando seu dashboard…</span>
      <header className="flex min-h-24 items-center gap-3 border-b border-border px-4 py-4 sm:px-8">
        <DashboardMenuButton />
        <div className="min-w-0 flex-1">
          <p className="text-[10px] tracking-[0.16em] text-muted-foreground">LYNKO STUDIO</p>
          <h1 className="mt-1 text-xl font-bold tracking-tight sm:text-2xl">{title}</h1>
        </div>
        <Skeleton className="hidden h-10 w-44 sm:block" />
        <Skeleton className="h-11 w-11 sm:w-32" />
      </header>
      <div aria-hidden="true" className="mx-auto max-w-[1600px] p-4 sm:p-8 xl:px-12 xl:py-8">
        {children}
      </div>
    </div>
  )
}
