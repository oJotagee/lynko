import { getDashboard } from '../../_data-access/get-dashboard'

export async function LinksBadge() {
  const dashboard = await getDashboard().catch(() => null)

  if (!dashboard) return null

  return (
    <span className="ml-auto rounded-full bg-sidebar-foreground/15 px-1.5 py-0.5 text-[11px] text-accent">
      {dashboard.links.length}
    </span>
  )
}
