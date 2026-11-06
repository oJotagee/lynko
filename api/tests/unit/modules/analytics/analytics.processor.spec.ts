import { afterEach, beforeEach, describe, expect, it, mock, spyOn } from 'bun:test'
import { randomUUID } from 'node:crypto'
import { UnrecoverableError } from 'bullmq'
import { PgDialect } from 'drizzle-orm/pg-core'
import type { AnalyticsEvent } from '../../../../src/modules/analytics/analytics.dto'
import {
  PROCESSED_RETENTION_MS,
  processAnalyticsJob,
} from '../../../../src/modules/analytics/analytics.processor'
import {
  analyticsRepository,
  buildRecordEventStatement,
} from '../../../../src/modules/analytics/analytics.repository'

const pageId = randomUUID()

function view(overrides: Partial<AnalyticsEvent> = {}) {
  return {
    type: 'view',
    eventId: randomUUID(),
    pageId,
    occurredAt: '2026-11-06T12:00:00.000Z',
    ...overrides,
  } as AnalyticsEvent
}

function render(event: AnalyticsEvent) {
  return new PgDialect().sqlToQuery(buildRecordEventStatement(event))
}

describe('analytics processor', () => {
  const processed = new Set<string>()

  const counters = new Map<string, number>()

  let processedAt = new Map<string, Date>()

  beforeEach(() => {
    processed.clear()

    counters.clear()

    processedAt = new Map()

    spyOn(analyticsRepository, 'recordEvent').mockImplementation(async (event) => {
      if (processed.has(event.eventId)) return

      processed.add(event.eventId)

      const date = event.occurredAt.slice(0, 10)

      const key = `${event.type}:${event.pageId}:${date}`

      counters.set(key, (counters.get(key) ?? 0) + 1)
    })

    spyOn(analyticsRepository, 'deleteProcessedBefore').mockImplementation(async (limit) => {
      for (const [id, at] of processedAt) if (at < limit) processedAt.delete(id)
    })
  })

  afterEach(() => {
    mock.restore()
  })

  it('counts a repeated eventId once', async () => {
    const event = view()

    await processAnalyticsJob({ name: 'view', data: event })

    await processAnalyticsJob({ name: 'view', data: event })

    expect([...counters.values()]).toEqual([1])
  })

  it('counts 40 of 50 concurrent events when 10 are repeated', async () => {
    const events = Array.from({ length: 40 }, () => view())

    const jobs = [...events, ...events.slice(0, 10)].map((data) =>
      processAnalyticsJob({ name: 'view', data }),
    )

    await Promise.all(jobs)

    expect([...counters.values()]).toEqual([40])
  })

  it('files an event under its UTC day', async () => {
    await processAnalyticsJob({
      name: 'view',
      data: view({ occurredAt: '2026-11-06T23:59:59.000Z' }),
    })

    await processAnalyticsJob({
      name: 'view',
      data: view({ occurredAt: '2026-11-07T00:00:00.000Z' }),
    })

    expect([...counters.keys()].sort()).toEqual([
      `view:${pageId}:2026-11-06`,
      `view:${pageId}:2026-11-07`,
    ])
  })

  it('does not retry an invalid payload', async () => {
    await expect(
      processAnalyticsJob({ name: 'view', data: { type: 'view' } }),
    ).rejects.toBeInstanceOf(UnrecoverableError)

    expect(analyticsRepository.recordEvent).not.toHaveBeenCalled()
  })

  it('cleanup deletes only events older than the retention window', async () => {
    const now = Date.now()

    processedAt.set('old', new Date(now - PROCESSED_RETENTION_MS - 60_000))

    processedAt.set('recent', new Date(now - PROCESSED_RETENTION_MS + 60_000))

    await processAnalyticsJob({ name: 'cleanup', data: {} })

    expect([...processedAt.keys()]).toEqual(['recent'])
    expect(analyticsRepository.recordEvent).not.toHaveBeenCalled()
  })
})

describe('recordEvent statement', () => {
  it('is one statement that dedupes by event id and upserts the page view counter', () => {
    const event = view()

    const { sql, params } = render(event)

    expect(sql).toContain('WITH inserted AS')
    expect(sql).toContain('INSERT INTO "analytics_processed_events"')
    expect(sql).toContain('ON CONFLICT DO NOTHING')
    expect(sql).toContain('INSERT INTO "page_views_daily"')
    expect(sql).toContain('FROM inserted')
    expect(sql).toContain('ON CONFLICT ("page_id", "date") DO UPDATE')
    expect(sql).toContain('"views" = "page_views_daily"."views" + 1')
    expect(sql).toContain("AT TIME ZONE 'UTC'")
    expect(sql.match(/;/g)).toBeNull()
    expect(params).toContain(event.eventId)
  })

  it('targets the link and social tables with their own keys', () => {
    const link = render({
      ...view(),
      type: 'link_click',
      linkId: randomUUID(),
    } as AnalyticsEvent)

    const social = render({ ...view(), type: 'social_click', platform: 'github' } as AnalyticsEvent)

    expect(link.sql).toContain('ON CONFLICT ("page_id", "link_id", "date") DO UPDATE')
    expect(link.sql).toContain('"clicks" = "link_clicks_daily"."clicks" + 1')
    expect(social.sql).toContain('ON CONFLICT ("page_id", "platform", "date") DO UPDATE')
    expect(social.sql).toContain('"clicks" = "social_clicks_daily"."clicks" + 1')
  })
})
