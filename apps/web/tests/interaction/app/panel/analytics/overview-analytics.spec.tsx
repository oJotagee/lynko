import { describe, expect, it, mock } from 'bun:test'
import { screen } from '@testing-library/react'

import { renderWithProviders } from '../../../support/render'

const root = '@/app/[locale]/(panel)/dashboard/analytics/_data-access'

mock.module(`${root}/get-analytics-overview`, () => ({
  getAnalyticsOverview: async () => ({
    pageViews: 2842,
    linkClicks: 1206,
    socialClicks: 10,
    totalClicks: 1216,
    ctr: 42.4,
  }),
}))

mock.module(`${root}/get-analytics-timeseries`, () => ({
  getAnalyticsTimeseries: async () => [{ date: '2026-11-06', views: 5, clicks: 1 }],
}))

mock.module(`${root}/get-analytics-links`, () => ({
  getAnalyticsLinks: async () => [
    {
      linkId: 'a',
      title: 'Meu portfólio',
      url: 'https://studio.maya.design',
      clicks: 184,
      share: 50,
    },
  ],
}))

mock.module(`${root}/get-analytics-social`, () => ({ getAnalyticsSocial: async () => [] }))

const { OverviewAnalytics } = await import(
  '@/app/[locale]/(panel)/dashboard/_components/overview/overview-analytics'
)

describe('OverviewAnalytics', () => {
  it('shows analytics cards, the chart and the top links on the overview', async () => {
    renderWithProviders(
      <OverviewAnalytics activeLinks={3} totalLinks={4}>
        <p>Seus links</p>
      </OverviewAnalytics>,
    )

    expect(await screen.findByText('2.842')).toBeInTheDocument()
    expect(screen.getByText('1.206')).toBeInTheDocument()
    expect(screen.getByText('42,4%')).toBeInTheDocument()
    expect(screen.getByText('de 4 cadastrados')).toBeInTheDocument()
    expect(screen.getByText('Meu portfólio')).toBeInTheDocument()
    expect(screen.getByText('Seus links')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '30 dias' })).toBeInTheDocument()
  })
})
