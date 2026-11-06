import { beforeEach, describe, expect, it, mock } from 'bun:test'
import { screen, waitFor } from '@testing-library/react'

import type { AnalyticsPeriod } from '@/app/[locale]/(panel)/dashboard/analytics/_data-access/analytics-period'
import { renderWithProviders } from '../../../support/render'

const overview = mock(async (_period: AnalyticsPeriod) => ({
  pageViews: 1200,
  linkClicks: 90,
  socialClicks: 30,
  totalClicks: 120,
  ctr: 10,
}))

const timeseries = mock(async (_period: AnalyticsPeriod) => [
  { date: '2026-11-05', views: 5, clicks: 1 },
  { date: '2026-11-06', views: 7, clicks: 2 },
])

const links = mock(async (_period: AnalyticsPeriod) => [
  { linkId: 'a', title: 'Portfólio', clicks: 60, share: 66.67 },
  { linkId: 'b', title: null, clicks: 30, share: 33.33 },
])

const social = mock(async (_period: AnalyticsPeriod) => [
  { platform: 'instagram', clicks: 30, share: 100 },
])

const root = '@/app/[locale]/(panel)/dashboard/analytics/_data-access'

mock.module(`${root}/get-analytics-overview`, () => ({ getAnalyticsOverview: overview }))
mock.module(`${root}/get-analytics-timeseries`, () => ({ getAnalyticsTimeseries: timeseries }))
mock.module(`${root}/get-analytics-links`, () => ({ getAnalyticsLinks: links }))
mock.module(`${root}/get-analytics-social`, () => ({ getAnalyticsSocial: social }))

const { Analytics } = await import(
  '@/app/[locale]/(panel)/dashboard/analytics/_components/analytics'
)

const emptyOverview = { pageViews: 0, linkClicks: 0, socialClicks: 0, totalClicks: 0, ctr: 0 }

describe('Analytics', () => {
  beforeEach(() => {
    for (const fn of [overview, timeseries, links, social]) fn.mockClear()
  })

  it('shows a skeleton while loading', () => {
    renderWithProviders(<Analytics />)

    expect(screen.getByText('Carregando analytics…')).toBeInTheDocument()
  })

  it('shows the numbers, the chart, the top links and the social ranking from the api', async () => {
    renderWithProviders(<Analytics />)

    expect(await screen.findByText('1.200')).toBeInTheDocument()
    expect(screen.getByText('10%')).toBeInTheDocument()
    expect(screen.getByText('Visualizações e cliques por dia')).toBeInTheDocument()
    expect(document.querySelector('[data-slot="chart"]')).not.toBeNull()
    expect(screen.getByText('Portfólio')).toBeInTheDocument()
    expect(screen.getByText('Link removido')).toBeInTheDocument()
    expect(screen.getByText('Instagram', { selector: 'span' })).toBeInTheDocument()
  })

  it('reloads the four queries with the new period', async () => {
    const { user } = renderWithProviders(<Analytics />)

    await screen.findByText('1.200')

    await user.click(screen.getByRole('button', { name: '30 dias' }))

    await waitFor(() => {
      for (const fn of [overview, timeseries, links, social]) {
        expect(fn).toHaveBeenCalledWith('30d')
      }
    })
  })

  it('shows the empty state when there are no views or clicks', async () => {
    overview.mockResolvedValueOnce(emptyOverview)

    renderWithProviders(<Analytics />)

    expect(
      await screen.findByText('Ainda não há visitas nem cliques neste período'),
    ).toBeInTheDocument()
  })

  it('shows the error and retries', async () => {
    overview.mockRejectedValueOnce(new Error('falhou'))

    const { user } = renderWithProviders(<Analytics />)

    await user.click(await screen.findByRole('button', { name: 'Tentar novamente' }))

    expect(await screen.findByText('1.200')).toBeInTheDocument()
    expect(overview).toHaveBeenCalledTimes(2)
  })
})
