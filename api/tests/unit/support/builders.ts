import { randomUUID } from 'node:crypto'

import type {
  linkSchema,
  mediaSchema,
  pageSchema,
  sessionSchema,
  userSchema,
} from '../../../src/db/schema'
import { defaultPageTheme } from '../../../src/modules/pages/pages.theme'

export type User = typeof userSchema.$inferSelect

export type Session = typeof sessionSchema.$inferSelect

export type Page = typeof pageSchema.$inferSelect

export type Link = typeof linkSchema.$inferSelect

export type Media = typeof mediaSchema.$inferSelect

const createdAt = new Date('2026-01-01T00:00:00.000Z')

let pageRevision = 0

export function nextRevision() {
  pageRevision += 1

  return pageRevision
}

export function buildUser(overrides: Partial<User> = {}): User {
  return {
    id: randomUUID(),
    name: 'Maria Silva',
    email: 'maria@example.com',
    passwordHash: 'hashed-password',
    createdAt,
    updatedAt: createdAt,
    ...overrides,
  }
}

export function buildSession(overrides: Partial<Session> = {}): Session {
  return {
    id: randomUUID(),
    userId: randomUUID(),
    refreshTokenHash: 'hashed-secret',
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    revokedAt: null,
    createdAt,
    updatedAt: createdAt,
    ...overrides,
  }
}

export function buildPage(overrides: Partial<Page> = {}): Page {
  return {
    id: randomUUID(),
    userId: randomUUID(),
    username: 'maria',
    title: 'Maria Silva',
    bio: null,
    avatarUrl: null,
    avatarMediaId: null,
    theme: defaultPageTheme,
    socialLinks: [],
    appearance: null,
    isPublished: false,
    revision: nextRevision(),
    createdAt,
    updatedAt: createdAt,
    ...overrides,
  }
}

export function buildLink(overrides: Partial<Link> = {}): Link {
  return {
    id: randomUUID(),
    pageId: randomUUID(),
    title: 'Portfólio',
    url: 'https://example.com',
    position: 0,
    isActive: true,
    createdAt,
    updatedAt: createdAt,
    ...overrides,
  }
}

export function buildMedia(overrides: Partial<Media> = {}): Media {
  const id = overrides.id ?? randomUUID()

  const pageId = overrides.pageId ?? randomUUID()

  return {
    id,
    pageId,
    key: `pending/${pageId}/${id}`,
    type: 'avatar',
    mimeType: 'image/png',
    size: 1024,
    status: 'pending',
    createdAt,
    updatedAt: createdAt,
    ...overrides,
  }
}
