import { getDashboard } from '../_data-access/get-dashboard'
import { DashboardHeader } from './layout/dashboard-header'
import { DashboardMain } from './layout/dashboard-main'
import { toDashboardData } from './dashboard-data'
import { Overview } from './overview'

export async function OverviewContent() {
  const dashboard = await getDashboard()

  const data = toDashboardData(dashboard)

  const hasPage = !!dashboard.page

  return (
    <>
      <DashboardHeader
        title={`Olá, ${dashboard.user.name.split(' ')[0]}.`}
        data={data}
        hasPage={hasPage}
      />
      <DashboardMain hasPage={hasPage}>
        <Overview data={data} hasPage={hasPage} />
      </DashboardMain>
    </>
  )
}
