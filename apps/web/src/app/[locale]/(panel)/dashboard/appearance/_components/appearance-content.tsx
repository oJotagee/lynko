import { DashboardHeader } from '../../_components/layout/dashboard-header'
import { DashboardMain } from '../../_components/layout/dashboard-main'
import { toDashboardData } from '../../_components/dashboard-data'
import { getDashboard } from '../../_data-access/get-dashboard'
import { AppearanceEditor } from './appearance-editor'

export async function AppearanceContent() {
  const dashboard = await getDashboard()
  const data = toDashboardData(dashboard)
  const hasPage = !!dashboard.page

  return (
    <>
      <DashboardHeader title="Aparência" data={data} hasPage={hasPage} />
      <DashboardMain hasPage={hasPage}>
        <AppearanceEditor key={dashboard.page?.updatedAt} data={data} hasPage={hasPage} />
      </DashboardMain>
    </>
  )
}
