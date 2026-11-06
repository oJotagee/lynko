import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import { NotFoundError } from '../../shared/errors'
import { linksRepository } from '../links/links.repository'
import { pagesRepository } from '../pages/pages.repository'
import type { SocialPlatform } from '../pages/pages.social'
import type { AnalyticsEvent, Period, RecordViewBody } from './analytics.dto'
import { analyticsProducer } from './analytics.queue'
import { analyticsRepository } from './analytics.repository'

const BOT_PATTERN = /bot|crawl|spider|slurp|preview|facebookexternalhit|headless/i

const httpUrl = z.url({ protocol: /^https?$/ })

function isBot(userAgent: string | undefined) {
  return !userAgent || BOT_PATTERN.test(userAgent)
}

function track(event: AnalyticsEvent, userAgent: string | undefined) {
  if (isBot(userAgent)) return

  void analyticsProducer.enqueue(event).catch((error: unknown) => {
    console.error('Failed to enqueue analytics event', event.type, error)
  })
}

function toHttpUrlOrThrow(url: string) {
  if (!httpUrl.safeParse(url).success) throw new NotFoundError()

  return url
}

const DAY_MS = 24 * 60 * 60 * 1000

const round2 = (value: number) => Math.round(value * 100) / 100

const share = (clicks: number, total: number) => (total ? round2((clicks / total) * 100) : 0)

const toDay = (time: number) => new Date(time).toISOString().slice(0, 10)

export function getPeriodRange(period: Period, now = new Date()) {
  const days = Number.parseInt(period, 10)

  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())

  return {
    from: toDay(today - (days - 1) * DAY_MS),
    to: toDay(today),
    days: Array.from({ length: days }, (_, index) => toDay(today - (days - 1 - index) * DAY_MS)),
  }
}

async function getReportScope(userId: string, period: Period, now: Date) {
  const page = await pagesRepository.findByUserId(userId)

  if (!page) throw new NotFoundError('Page not found')

  const { from, to, days } = getPeriodRange(period, now)

  return { pageId: page.id, from, to, days }
}

function sumByDay(rows: { date: string; count: number }[]) {
  const totals = new Map<string, number>()

  for (const { date, count } of rows) totals.set(date, (totals.get(date) ?? 0) + count)

  return totals
}

export const analyticsService = {
  async getOverview(userId: string, period: Period, now = new Date()) {
    const { pageId, from, to } = await getReportScope(userId, period, now)

    const [pageViews, linkClicks, socialClicks] = await Promise.all([
      analyticsRepository.sumViews(pageId, from, to),
      analyticsRepository.sumLinkClicks(pageId, from, to),
      analyticsRepository.sumSocialClicks(pageId, from, to),
    ])

    const totalClicks = linkClicks + socialClicks

    return {
      pageViews,
      linkClicks,
      socialClicks,
      totalClicks,
      ctr: pageViews ? round2((totalClicks / pageViews) * 100) : 0,
    }
  },

  async getTimeseries(userId: string, period: Period, now = new Date()) {
    const { pageId, from, to, days } = await getReportScope(userId, period, now)

    const [views, clicks] = await Promise.all([
      analyticsRepository.viewsByDay(pageId, from, to),
      analyticsRepository.clicksByDay(pageId, from, to),
    ])

    const viewsByDay = sumByDay(views)

    const clicksByDay = sumByDay(clicks)

    return days.map((date) => ({
      date,
      views: viewsByDay.get(date) ?? 0,
      clicks: clicksByDay.get(date) ?? 0,
    }))
  },

  async getTopLinks(userId: string, period: Period, now = new Date()) {
    const { pageId, from, to } = await getReportScope(userId, period, now)

    const rows = await analyticsRepository.topLinks(pageId, from, to)

    const total = rows.reduce((sum, row) => sum + row.clicks, 0)

    return rows.map((row) => ({ ...row, share: share(row.clicks, total) }))
  },

  async getSocial(userId: string, period: Period, now = new Date()) {
    const { pageId, from, to } = await getReportScope(userId, period, now)

    const rows = await analyticsRepository.topSocial(pageId, from, to)

    const total = rows.reduce((sum, row) => sum + row.clicks, 0)

    return rows.map((row) => ({
      platform: row.platform,
      clicks: row.clicks,
      share: share(row.clicks, total),
    }))
  },

  async recordView({ pageId, eventId }: RecordViewBody, userAgent: string | undefined) {
    if (!(await pagesRepository.findPublishedById(pageId))) throw new NotFoundError()

    track({ type: 'view', eventId, pageId, occurredAt: new Date().toISOString() }, userAgent)
  },

  async resolveLinkRedirect(linkId: string, userAgent: string | undefined) {
    const target = await linksRepository.findPublicTarget(linkId)

    if (!target) throw new NotFoundError()

    const url = toHttpUrlOrThrow(target.url)

    track(
      {
        type: 'link_click',
        eventId: randomUUID(),
        pageId: target.pageId,
        linkId,
        occurredAt: new Date().toISOString(),
      },
      userAgent,
    )

    return url
  },

  async resolveSocialRedirect(
    pageId: string,
    platform: SocialPlatform,
    userAgent: string | undefined,
  ) {
    const page = await pagesRepository.findPublishedById(pageId)

    const social = page?.socialLinks.find((link) => link.platform === platform && link.isActive)

    if (!social) throw new NotFoundError()

    const url = toHttpUrlOrThrow(social.url)

    track(
      {
        type: 'social_click',
        eventId: randomUUID(),
        pageId,
        platform,
        occurredAt: new Date().toISOString(),
      },
      userAgent,
    )

    return url
  },
}
