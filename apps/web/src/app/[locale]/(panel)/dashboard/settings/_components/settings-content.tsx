import { toDashboardData } from '../../_components/dashboard-data'
import { DashboardHeader } from '../../_components/layout/dashboard-header'
import { DashboardMain } from '../../_components/layout/dashboard-main'
import { getDashboard } from '../../_data-access/get-dashboard'
import { SettingsPanel } from './settings-panel'

export async function SettingsContent() {
  const dashboard = await getDashboard()

  const data = toDashboardData(dashboard)

  const hasPage = !!dashboard.page

  return (
    <>
      <DashboardHeader title="Configurações" data={data} hasPage={hasPage} />
      <DashboardMain hasPage={hasPage}>
        <SettingsPanel user={dashboard.user} data={data} hasPage={hasPage} />
      </DashboardMain>
    </>
  )
}
