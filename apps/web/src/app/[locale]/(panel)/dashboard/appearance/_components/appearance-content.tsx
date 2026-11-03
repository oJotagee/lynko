import { DashboardHeader } from '../../_components/dashboard-header'
import { toDashboardData } from '../../_components/dashboard-data'
import { DashboardMain } from '../../_components/dashboard-main'
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
