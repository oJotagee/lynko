import { sql } from 'drizzle-orm'
import {
  bigint,
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgSequence,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'

import type { PageAppearance } from '../modules/pages/pages.appearance'
import type { SocialLink } from '../modules/pages/pages.social'
import type { PageTheme } from '../modules/pages/pages.theme'

export const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
}

export const userSchema = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar({ length: 100 }).notNull(),
  email: varchar({ length: 50 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  ...timestamps,
})

export const sessionSchema = pgTable(
  'sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => userSchema.id, { onDelete: 'cascade' }),
    refreshTokenHash: text('refresh_token_hash').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    ...timestamps,
  },
  (table) => [index('sessions_user_id_idx').on(table.userId)],
)

export const pageRevisionSequence = pgSequence('pages_revision_seq')

export const pageSchema = pgTable('pages', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .unique('pages_user_id_unique')
    .references(() => userSchema.id, { onDelete: 'cascade' }),
  username: varchar('username', { length: 30 }).notNull().unique('pages_username_unique'),
  title: varchar('title', { length: 80 }).notNull(),
  bio: varchar('bio', { length: 160 }),
  avatarUrl: text('avatar_url'),
  avatarMediaId: uuid('avatar_media_id'),
  theme: jsonb('theme').$type<PageTheme>().notNull(),
  appearance: jsonb('appearance').$type<PageAppearance>(),
  socialLinks: jsonb('social_links').$type<SocialLink[]>().notNull().default([]),
  isPublished: boolean('is_published').notNull().default(false),
  revision: bigint('revision', { mode: 'number' })
    .notNull()
    .default(sql`nextval('pages_revision_seq')`),
  ...timestamps,
})

export const linkSchema = pgTable(
  'links',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    pageId: uuid('page_id')
      .notNull()
      .references(() => pageSchema.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 80 }).notNull(),
    url: text('url').notNull(),
    position: integer('position').notNull().default(0),
    isActive: boolean('is_active').notNull().default(true),
    ...timestamps,
  },
  (table) => [index('links_page_id_position_idx').on(table.pageId, table.position)],
)

export const mediaSchema = pgTable(
  'media',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    pageId: uuid('page_id')
      .notNull()
      .references(() => pageSchema.id, { onDelete: 'cascade' }),
    key: text('key').notNull().unique('media_key_unique'),
    type: varchar('type', { length: 16 }).$type<'avatar' | 'background'>().notNull(),
    mimeType: varchar('mime_type', { length: 32 }).notNull(),
    size: integer('size').notNull(),
    status: varchar('status', { length: 16 })
      .$type<'pending' | 'ready' | 'failed'>()
      .notNull()
      .default('pending'),
    ...timestamps,
  },
  (table) => [index('media_page_id_status_idx').on(table.pageId, table.status)],
)

export const pageViewsDailySchema = pgTable(
  'page_views_daily',
  {
    pageId: uuid('page_id').notNull(),
    date: date('date', { mode: 'string' }).notNull(),
    views: integer('views').notNull().default(0),
    ...timestamps,
  },
  (table) => [primaryKey({ columns: [table.pageId, table.date] })],
)

export const linkClicksDailySchema = pgTable(
  'link_clicks_daily',
  {
    pageId: uuid('page_id').notNull(),
    linkId: uuid('link_id').notNull(),
    date: date('date', { mode: 'string' }).notNull(),
    clicks: integer('clicks').notNull().default(0),
    ...timestamps,
  },
  (table) => [
    primaryKey({ columns: [table.pageId, table.linkId, table.date] }),
    index('link_clicks_daily_page_id_date_idx').on(table.pageId, table.date),
  ],
)

export const socialClicksDailySchema = pgTable(
  'social_clicks_daily',
  {
    pageId: uuid('page_id').notNull(),
    platform: varchar('platform', { length: 32 }).notNull(),
    date: date('date', { mode: 'string' }).notNull(),
    clicks: integer('clicks').notNull().default(0),
    ...timestamps,
  },
  (table) => [
    primaryKey({ columns: [table.pageId, table.platform, table.date] }),
    index('social_clicks_daily_page_id_date_idx').on(table.pageId, table.date),
  ],
)

export const analyticsProcessedEventsSchema = pgTable(
  'analytics_processed_events',
  {
    eventId: uuid('event_id').primaryKey(),
    eventType: varchar('event_type', { length: 16 }).notNull(),
    processedAt: timestamp('processed_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('analytics_processed_events_processed_at_idx').on(table.processedAt)],
)
