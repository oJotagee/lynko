import { randomUUID } from 'node:crypto'

import type {
  authTokenSchema,
  customDomainSchema,
  linkSchema,
  mediaSchema,
  pageSchema,
  sessionSchema,
  subscriptionSchema,
  userSchema,
} from '../../../src/db/schema'
import { defaultPageTheme } from '../../../src/modules/pages/pages.theme'

export type User = typeof userSchema.$inferSelect

export type Session = typeof sessionSchema.$inferSelect

export type AuthToken = typeof authTokenSchema.$inferSelect

export type Page = typeof pageSchema.$inferSelect

export type Link = typeof linkSchema.$inferSelect

export type Media = typeof mediaSchema.$inferSelect

export type Subscription = typeof subscriptionSchema.$inferSelect

export type CustomDomain = typeof customDomainSchema.$inferSelect

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
    googleId: null,
    emailVerifiedAt: null,
    totpSecret: null,
    totpPendingSecret: null,
    totpEnabledAt: null,
    totpLastStep: null,
    totpFailedAttempts: 0,
    totpLockedUntil: null,
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
    userAgent: null,
    createdAt,
    updatedAt: createdAt,
    ...overrides,
  }
}

export function buildAuthToken(overrides: Partial<AuthToken> = {}): AuthToken {
  return {
    id: randomUUID(),
    userId: randomUUID(),
    type: 'email_verification',
    tokenHash: 'hashed-secret',
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
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
    showBranding: true,
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
    startsAt: null,
    endsAt: null,
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

export function buildSubscription(overrides: Partial<Subscription> = {}): Subscription {
  return {
    id: randomUUID(),
    userId: randomUUID(),
    cycle: 'monthly',
    status: 'active',
    providerCustomerId: 'cust_test',
    providerSubscriptionId: `subs_${randomUUID()}`,
    checkoutId: `bill_${randomUUID()}`,
    currentPeriodEnd: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
    cancelledAt: null,
    createdAt,
    updatedAt: createdAt,
    ...overrides,
  }
}

export function buildCustomDomain(overrides: Partial<CustomDomain> = {}): CustomDomain {
  return {
    id: randomUUID(),
    userId: randomUUID(),
    hostname: 'seunome.com',
    kind: 'apex',
    status: 'pending_owner',
    verificationToken: 'token-test',
    lastError: null,
    ownerVerifiedAt: null,
    activatedAt: null,
    lastCheckedAt: null,
    createdAt,
    updatedAt: createdAt,
    ...overrides,
  }
}
