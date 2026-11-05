import { toDashboardData } from '../../_components/dashboard-data'
import { DashboardHeader } from '../../_components/layout/dashboard-header'
import { DashboardMain } from '../../_components/layout/dashboard-main'
import { getDashboard } from '../../_data-access/get-dashboard'
import { LinksEditor } from './links-editor'

interface LinksContentProps {
  searchParams: Promise<{ new?: string }>
}

export async function LinksContent({ searchParams }: LinksContentProps) {
  const [dashboard, { new: isNew }] = await Promise.all([getDashboard(), searchParams])

  const data = toDashboardData(dashboard)

  const hasPage = !!dashboard.page

  return (
    <>
      <DashboardHeader title="Meus links" data={data} hasPage={hasPage} />
      <DashboardMain hasPage={hasPage}>
        <LinksEditor data={data} hasPage={hasPage} startCreating={isNew === '1'} />
      </DashboardMain>
    </>
  )
}
