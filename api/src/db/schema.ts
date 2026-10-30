import { boolean, index, jsonb, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'

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
  theme: jsonb('theme').$type<PageTheme>().notNull(),
  isPublished: boolean('is_published').notNull().default(false),
  ...timestamps,
})
