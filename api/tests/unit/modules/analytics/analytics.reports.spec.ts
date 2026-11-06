import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'
import { randomUUID } from 'node:crypto'
import {
  analyticsService,
  getPeriodRange,
} from '../../../../src/modules/analytics/analytics.service'
import { NotFoundError } from '../../../../src/shared/errors'
import { buildLink, buildPage } from '../../support/builders'
import { useInMemoryRepositories } from '../../support/memory-repositories'

const now = new Date('2026-11-06T23:59:59.000Z')

describe('analytics reports', () => {
  let store: ReturnType<typeof useInMemoryRepositories>

  let page: ReturnType<typeof buildPage>

  beforeEach(() => {
    store = useInMemoryRepositories()

    page = buildPage()

    store.pages.push(page)
  })

  afterEach(() => {
    mock.restore()
  })

  function addViews(date: string, count: number, pageId = page.id) {
    store.analytics.views.push({ pageId, date, count })
  }

  function addLinkClicks(linkId: string, date: string, count: number, pageId = page.id) {
    store.analytics.links.push({ pageId, linkId, date, count })
  }

  function addSocialClicks(platform: string, date: string, count: number, pageId = page.id) {
    store.analytics.social.push({ pageId, platform, date, count })
  }

  it.each([
    ['7d', 7],
    ['30d', 30],
    ['90d', 90],
  ] as const)(
    'timeseries for %s has %i consecutive days ending today with zeros',
    async (period, size) => {
      const series = await analyticsService.getTimeseries(page.userId, period, now)

      expect(series).toHaveLength(size)
      expect(series.at(-1)?.date).toBe('2026-11-06')
      expect(series.every((point) => point.views === 0 && point.clicks === 0)).toBe(true)
    },
  )

  it('computes the period range in UTC around midnight', () => {
    expect(getPeriodRange('7d', new Date('2026-11-06T23:59:59.000Z'))).toMatchObject({
      from: '2026-10-31',
      to: '2026-11-06',
    })

    expect(getPeriodRange('7d', new Date('2026-11-07T00:00:00.000Z'))).toMatchObject({
      from: '2026-11-01',
      to: '2026-11-07',
    })
  })

  it('sums only the own page and the days inside the period', async () => {
    const link = randomUUID()

    addViews('2026-11-06', 10)
    addViews('2026-10-30', 99)
    addViews('2026-11-06', 500, randomUUID())
    addLinkClicks(link, '2026-11-05', 3)
    addLinkClicks(link, '2026-11-05', 700, randomUUID())
    addSocialClicks('github', '2026-11-06', 2)

    expect(await analyticsService.getOverview(page.userId, '7d', now)).toEqual({
      pageViews: 10,
      linkClicks: 3,
      socialClicks: 2,
      totalClicks: 5,
      ctr: 50,
    })
  })

  it('has ctr 0 with no views and allows ctr above 100', async () => {
    addLinkClicks(randomUUID(), '2026-11-06', 4)

    expect((await analyticsService.getOverview(page.userId, '7d', now)).ctr).toBe(0)

    addViews('2026-11-06', 2)

    expect((await analyticsService.getOverview(page.userId, '7d', now)).ctr).toBe(200)
  })

  it('merges views and link plus social clicks per day', async () => {
    addViews('2026-11-05', 4)
    addLinkClicks(randomUUID(), '2026-11-05', 1)
    addSocialClicks('github', '2026-11-05', 2)

    const series = await analyticsService.getTimeseries(page.userId, '7d', now)

    expect(series.find((point) => point.date === '2026-11-05')).toEqual({
      date: '2026-11-05',
      views: 4,
      clicks: 3,
    })
  })

  it('ranks links by clicks with share and a null title for a deleted link', async () => {
    const kept = buildLink({ pageId: page.id, title: 'Portfólio' })

    store.links.push(kept)

    addLinkClicks(kept.id, '2026-11-06', 3)

    const deleted = randomUUID()

    addLinkClicks(deleted, '2026-11-06', 1)

    expect(await analyticsService.getTopLinks(page.userId, '7d', now)).toEqual([
      { linkId: kept.id, title: 'Portfólio', url: kept.url, clicks: 3, share: 75 },
      { linkId: deleted, title: null, url: null, clicks: 1, share: 25 },
    ])
  })

  it('ranks social platforms with share', async () => {
    addSocialClicks('github', '2026-11-06', 1)
    addSocialClicks('instagram', '2026-11-06', 2)

    expect(await analyticsService.getSocial(page.userId, '7d', now)).toEqual([
      { platform: 'instagram', clicks: 2, share: 66.67 },
      { platform: 'github', clicks: 1, share: 33.33 },
    ])
  })

  it('throws NotFoundError for a user without a page', async () => {
    await expect(analyticsService.getOverview(randomUUID(), '7d', now)).rejects.toBeInstanceOf(
      NotFoundError,
    )
  })
})
