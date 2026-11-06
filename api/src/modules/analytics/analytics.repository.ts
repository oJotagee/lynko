import { and, between, desc, eq, getTableName, lt, type SQL, sql } from 'drizzle-orm'
import type { PgColumn, PgTable } from 'drizzle-orm/pg-core'
import { db } from '../../db'
import {
  analyticsProcessedEventsSchema,
  linkClicksDailySchema,
  linkSchema,
  pageViewsDailySchema,
  socialClicksDailySchema,
} from '../../db/schema'
import type { AnalyticsEvent } from './analytics.dto'

function table(target: PgTable) {
  return sql.identifier(getTableName(target))
}

function column(target: PgColumn) {
  return sql.identifier(target.name)
}

function upsertCount(
  target: PgTable,
  keys: { column: PgColumn; value: SQL }[],
  counter: PgColumn,
  event: AnalyticsEvent,
) {
  const names = sql.join(
    keys.map((key) => column(key.column)),
    sql`, `,
  )

  const values = sql.join(
    keys.map((key) => key.value),
    sql`, `,
  )

  return sql`
    WITH inserted AS (
      INSERT INTO ${table(analyticsProcessedEventsSchema)}
        (${column(analyticsProcessedEventsSchema.eventId)}, ${column(analyticsProcessedEventsSchema.eventType)})
      VALUES (${event.eventId}::uuid, ${event.type})
      ON CONFLICT DO NOTHING
      RETURNING ${column(analyticsProcessedEventsSchema.eventId)}
    )
    INSERT INTO ${table(target)} (${names}, ${column(counter)})
    SELECT ${values}, 1 FROM inserted
    ON CONFLICT (${names}) DO UPDATE
    SET ${column(counter)} = ${table(target)}.${column(counter)} + 1, updated_at = now()
  `
}

function eventDate(event: AnalyticsEvent) {
  return sql`(${event.occurredAt}::timestamptz AT TIME ZONE 'UTC')::date`
}

export function buildRecordEventStatement(event: AnalyticsEvent) {
  const page = { column: pageViewsDailySchema.pageId, value: sql`${event.pageId}::uuid` }

  const date = (target: PgColumn) => ({ column: target, value: eventDate(event) })

  if (event.type === 'view') {
    return upsertCount(
      pageViewsDailySchema,
      [page, date(pageViewsDailySchema.date)],
      pageViewsDailySchema.views,
      event,
    )
  }

  if (event.type === 'link_click') {
    return upsertCount(
      linkClicksDailySchema,
      [
        { ...page, column: linkClicksDailySchema.pageId },
        { column: linkClicksDailySchema.linkId, value: sql`${event.linkId}::uuid` },
        date(linkClicksDailySchema.date),
      ],
      linkClicksDailySchema.clicks,
      event,
    )
  }

  return upsertCount(
    socialClicksDailySchema,
    [
      { ...page, column: socialClicksDailySchema.pageId },
      { column: socialClicksDailySchema.platform, value: sql`${event.platform}::varchar` },
      date(socialClicksDailySchema.date),
    ],
    socialClicksDailySchema.clicks,
    event,
  )
}

const total = (column: PgColumn) => sql<number>`coalesce(sum(${column}), 0)::int`

function inRange(
  target: { pageId: PgColumn; date: PgColumn },
  pageId: string,
  from: string,
  to: string,
) {
  return and(eq(target.pageId, pageId), between(target.date, from, to))
}

export const analyticsRepository = {
  async recordEvent(event: AnalyticsEvent) {
    await db.execute(buildRecordEventStatement(event))
  },

  async deleteProcessedBefore(date: Date) {
    await db
      .delete(analyticsProcessedEventsSchema)
      .where(lt(analyticsProcessedEventsSchema.processedAt, date))
  },

  async sumViews(pageId: string, from: string, to: string) {
    const [row] = await db
      .select({ value: total(pageViewsDailySchema.views) })
      .from(pageViewsDailySchema)
      .where(inRange(pageViewsDailySchema, pageId, from, to))

    return row?.value ?? 0
  },

  async sumLinkClicks(pageId: string, from: string, to: string) {
    const [row] = await db
      .select({ value: total(linkClicksDailySchema.clicks) })
      .from(linkClicksDailySchema)
      .where(inRange(linkClicksDailySchema, pageId, from, to))

    return row?.value ?? 0
  },

  async sumSocialClicks(pageId: string, from: string, to: string) {
    const [row] = await db
      .select({ value: total(socialClicksDailySchema.clicks) })
      .from(socialClicksDailySchema)
      .where(inRange(socialClicksDailySchema, pageId, from, to))

    return row?.value ?? 0
  },

  async viewsByDay(pageId: string, from: string, to: string) {
    return db
      .select({ date: pageViewsDailySchema.date, count: total(pageViewsDailySchema.views) })
      .from(pageViewsDailySchema)
      .where(inRange(pageViewsDailySchema, pageId, from, to))
      .groupBy(pageViewsDailySchema.date)
  },

  async clicksByDay(pageId: string, from: string, to: string) {
    const [links, social] = await Promise.all([
      db
        .select({ date: linkClicksDailySchema.date, count: total(linkClicksDailySchema.clicks) })
        .from(linkClicksDailySchema)
        .where(inRange(linkClicksDailySchema, pageId, from, to))
        .groupBy(linkClicksDailySchema.date),
      db
        .select({
          date: socialClicksDailySchema.date,
          count: total(socialClicksDailySchema.clicks),
        })
        .from(socialClicksDailySchema)
        .where(inRange(socialClicksDailySchema, pageId, from, to))
        .groupBy(socialClicksDailySchema.date),
    ])

    return [...links, ...social]
  },

  async topLinks(pageId: string, from: string, to: string) {
    const clicks = total(linkClicksDailySchema.clicks)

    return db
      .select({
        linkId: linkClicksDailySchema.linkId,
        title: linkSchema.title,
        url: linkSchema.url,
        clicks,
      })
      .from(linkClicksDailySchema)
      .leftJoin(
        linkSchema,
        and(
          eq(linkSchema.id, linkClicksDailySchema.linkId),
          eq(linkSchema.pageId, linkClicksDailySchema.pageId),
        ),
      )
      .where(inRange(linkClicksDailySchema, pageId, from, to))
      .groupBy(linkClicksDailySchema.linkId, linkSchema.title, linkSchema.url)
      .orderBy(desc(clicks))
  },

  async topSocial(pageId: string, from: string, to: string) {
    const clicks = total(socialClicksDailySchema.clicks)

    return db
      .select({ platform: socialClicksDailySchema.platform, clicks })
      .from(socialClicksDailySchema)
      .where(inRange(socialClicksDailySchema, pageId, from, to))
      .groupBy(socialClicksDailySchema.platform)
      .orderBy(desc(clicks))
  },
}
