import { toDashboardData } from '../../_components/dashboard-data'
import { DashboardHeader } from '../../_components/layout/dashboard-header'
import { DashboardMain } from '../../_components/layout/dashboard-main'
import { getDashboard } from '../../_data-access/get-dashboard'
import { Analytics } from './analytics'

export async function AnalyticsContent() {
  const dashboard = await getDashboard()

  const data = toDashboardData(dashboard)

  const hasPage = !!dashboard.page

  return (
    <>
      <DashboardHeader title="Analytics" data={data} hasPage={hasPage} />
      <DashboardMain hasPage={hasPage}>
        <Analytics links={data.links} />
      </DashboardMain>
    </>
  )
}
