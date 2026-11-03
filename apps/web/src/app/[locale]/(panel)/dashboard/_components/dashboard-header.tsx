import { DashboardMenuButton } from './dashboard-menu-button'
import { CopyPageUrlButton } from './copy-page-url-button'
import { PreviewPageButton } from './preview-page-button'
import type { DashboardData } from './dashboard-data'

interface DashboardHeaderProps {
  title: string
  data: DashboardData
  hasPage: boolean
}

export function DashboardHeader({ title, data, hasPage }: DashboardHeaderProps) {
  return (
    <header className="flex min-h-24 items-center gap-3 border-b border-border px-4 py-4 sm:px-8">
      <DashboardMenuButton />
      <div className="min-w-0 flex-1">
        <p className="text-[10px] tracking-[0.16em] text-muted-foreground">LYNKO STUDIO</p>
        <h1 className="mt-1 text-xl font-bold tracking-tight sm:text-2xl">{title}</h1>
      </div>
      <CopyPageUrlButton profile={data.profile} hasPage={hasPage} />
      <PreviewPageButton data={data} />
    </header>
  )
}
