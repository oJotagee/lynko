import { toDashboardData } from '../../_components/dashboard-data'
import { DashboardHeader } from '../../_components/layout/dashboard-header'
import { DashboardMain } from '../../_components/layout/dashboard-main'
import { getDashboard } from '../../_data-access/get-dashboard'

export async function PlansContent({ children }: { children: React.ReactNode }) {
  const dashboard = await getDashboard()

  const data = toDashboardData(dashboard)

  const hasPage = !!dashboard.page

  return (
    <>
      <DashboardHeader title="Planos" data={data} hasPage={hasPage} />
      <DashboardMain hasPage={hasPage}>{children}</DashboardMain>
    </>
  )
}
