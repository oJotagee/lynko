import { spyOn } from 'bun:test'

import { analyticsRepository } from '../../../src/modules/analytics/analytics.repository'
import { authRepository } from '../../../src/modules/auth/auth.repository'
import {
  billingRepository,
  type Subscription,
} from '../../../src/modules/billing/billing.repository'
import { domainsRepository } from '../../../src/modules/domains/domains.repository'
import { linksRepository } from '../../../src/modules/links/links.repository'
import { type MailMessage, mailService } from '../../../src/modules/mail/mail.service'
import { mediaRepository } from '../../../src/modules/media/media.repository'
import { pagesRepository } from '../../../src/modules/pages/pages.repository'
import { twoFactorRepository } from '../../../src/modules/two-factor/two-factor.repository'
import { usersRepository } from '../../../src/modules/users/users.repository'
import {
  type AuthToken,
  buildAuthToken,
  buildCustomDomain,
  buildLink,
  buildMedia,
  buildPage,
  buildSession,
  buildSubscription,
  buildUser,
  type CustomDomain,
  type Link,
  type Media,
  nextRevision,
  type Page,
  type Session,
  type User,
} from './builders'

function toPublicUser({
  id,
  name,
  email,
  passwordHash,
  googleId,
  emailVerifiedAt,
  totpEnabledAt,
  createdAt,
  updatedAt,
}: User) {
  return {
    id,
    name,
    email,
    createdAt,
    updatedAt,
    hasPassword: passwordHash !== null,
    hasGoogle: googleId !== null,
    emailVerified: emailVerifiedAt !== null,
    twoFactorEnabled: totpEnabledAt !== null,
  }
}

function bumpRevision(store: { pages: Page[] }, pageId: string) {
  const page = store.pages.find((item) => item.id === pageId)

  if (!page) return undefined

  page.revision = nextRevision()

  return {
    id: page.id,
    username: page.username,
    revision: page.revision,
    isPublished: page.isPublished,
  }
}

type DailyRow = { pageId: string; date: string; count: number }

function inRange(row: DailyRow, pageId: string, from: string, to: string) {
  return row.pageId === pageId && row.date >= from && row.date <= to
}

function sumCounts(rows: DailyRow[]) {
  return rows.reduce((sum, row) => sum + row.count, 0)
}

function groupCounts<Row extends DailyRow>(rows: Row[], key: (row: Row) => string) {
  const groups = new Map<string, number>()

  for (const row of rows) groups.set(key(row), (groups.get(key(row)) ?? 0) + row.count)

  return [...groups].sort((a, b) => b[1] - a[1])
}

function byPosition(a: Link, b: Link) {
  return a.position - b.position || a.createdAt.getTime() - b.createdAt.getTime()
}

type RecoveryCode = { userId: string; codeHash: string; usedAt: Date | null }

export function useInMemoryRepositories() {
  const store = {
    users: [] as User[],
    sessions: [] as Session[],
    authTokens: [] as AuthToken[],
    recoveryCodes: [] as RecoveryCode[],
    subscriptions: [] as Subscription[],
    customDomains: [] as CustomDomain[],
    billingEvents: new Set<string>(),
    mails: [] as MailMessage[],
    pages: [] as Page[],
    links: [] as Link[],
    media: [] as Media[],
    analytics: {
      views: [] as DailyRow[],
      qrViews: [] as DailyRow[],
      links: [] as (DailyRow & { linkId: string })[],
      social: [] as (DailyRow & { platform: string })[],
    },
  }

  spyOn(authRepository, 'findByEmailWithPassword').mockImplementation(async (email) =>
    store.users.find((user) => user.email === email),
  )

  spyOn(authRepository, 'existsByEmail').mockImplementation(async (email) =>
    store.users.some((user) => user.email === email),
  )

  spyOn(authRepository, 'create').mockImplementation(async ({ id, ...data }) => {
    const user = buildUser({ ...data, ...(id && { id }) })

    store.users.push(user)

    return toPublicUser(user)
  })

  spyOn(authRepository, 'findByGoogleId').mockImplementation(async (googleId) =>
    store.users.find((user) => user.googleId === googleId),
  )

  spyOn(authRepository, 'linkGoogle').mockImplementation(
    async (userId, googleId, clearCredentials) => {
      const user = store.users.find((item) => item.id === userId && !item.googleId)

      if (!user) return false

      user.googleId = googleId

      user.emailVerifiedAt ??= new Date()

      if (clearCredentials) {
        user.passwordHash = null

        for (const session of store.sessions) {
          if (session.userId === userId && !session.revokedAt) session.revokedAt = new Date()
        }
      }

      return true
    },
  )

  spyOn(authRepository, 'createSession').mockImplementation(
    async ({ id, userId, ...data }, expectedPasswordHash) => {
      const user = store.users.find((item) => item.id === userId)

      if (user?.passwordHash !== expectedPasswordHash) return false

      store.sessions.push(buildSession({ id, userId, ...data, revokedAt: null }))

      return true
    },
  )

  spyOn(authRepository, 'findSessionById').mockImplementation(async (id) =>
    store.sessions.find((session) => session.id === id),
  )

  spyOn(authRepository, 'rotateSessionToken').mockImplementation(
    async (id, refreshTokenHash, expiresAt) => {
      const session = store.sessions.find((item) => item.id === id && !item.revokedAt)

      if (session) Object.assign(session, { refreshTokenHash, expiresAt })
    },
  )

  spyOn(authRepository, 'listActiveSessions').mockImplementation(async (userId) =>
    store.sessions
      .filter(
        (session) =>
          session.userId === userId && !session.revokedAt && session.expiresAt > new Date(),
      )
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .map(({ id, userAgent, createdAt, updatedAt }) => ({ id, userAgent, createdAt, updatedAt })),
  )

  spyOn(authRepository, 'revokeUserSession').mockImplementation(async (userId, id) => {
    const session = store.sessions.find(
      (item) =>
        item.id === id && item.userId === userId && !item.revokedAt && item.expiresAt > new Date(),
    )

    if (session) session.revokedAt = new Date()

    return Boolean(session)
  })

  spyOn(authRepository, 'revokeOtherSessions').mockImplementation(async (userId, keepSessionId) => {
    const others = store.sessions.filter(
      (item) => item.userId === userId && item.id !== keepSessionId && !item.revokedAt,
    )

    for (const session of others) session.revokedAt = new Date()

    return others.length
  })

  spyOn(authRepository, 'revokeSession').mockImplementation(async (id) => {
    const session = store.sessions.find((item) => item.id === id && !item.revokedAt)

    if (session) session.revokedAt = new Date()
  })

  spyOn(mailService, 'send').mockImplementation(async (message) => {
    store.mails.push(message)
  })

  spyOn(authRepository, 'markEmailVerified').mockImplementation(async (userId) => {
    const user = store.users.find((item) => item.id === userId && !item.emailVerifiedAt)

    if (user) user.emailVerifiedAt = new Date()
  })

  spyOn(authRepository, 'resetPasswordAndRevokeSessions').mockImplementation(
    async (userId, passwordHash) => {
      const user = store.users.find((item) => item.id === userId)

      if (user) {
        user.passwordHash = passwordHash

        user.emailVerifiedAt ??= new Date()
      }

      for (const session of store.sessions) {
        if (session.userId === userId && !session.revokedAt) session.revokedAt = new Date()
      }
    },
  )

  spyOn(authRepository, 'updatePasswordRevokingOthers').mockImplementation(
    async (userId, passwordHash, keepSessionId, expectedPasswordHash) => {
      const user = store.users.find(
        (item) => item.id === userId && item.passwordHash === expectedPasswordHash,
      )

      if (!user) return false

      user.passwordHash = passwordHash

      for (const session of store.sessions) {
        if (session.userId === userId && session.id !== keepSessionId && !session.revokedAt) {
          session.revokedAt = new Date()
        }
      }

      return true
    },
  )

  spyOn(authRepository, 'replaceToken').mockImplementation(
    async (userId, type, token, cooldownSeconds) => {
      const current = store.authTokens.find((item) => item.userId === userId && item.type === type)

      if (
        current &&
        cooldownSeconds !== undefined &&
        current.createdAt.getTime() > Date.now() - cooldownSeconds * 1000
      ) {
        return false
      }

      store.authTokens = store.authTokens.filter((item) => item !== current)

      store.authTokens.push(buildAuthToken({ ...token, userId, type, createdAt: new Date() }))

      return true
    },
  )

  spyOn(authRepository, 'findToken').mockImplementation(async (id, type) =>
    store.authTokens.find((item) => item.id === id && item.type === type),
  )

  spyOn(authRepository, 'consumeToken').mockImplementation(async (id, type) => {
    const token = store.authTokens.find(
      (item) => item.id === id && item.type === type && item.expiresAt > new Date(),
    )

    if (!token) return undefined

    store.authTokens = store.authTokens.filter((item) => item !== token)

    return token.userId
  })

  spyOn(authRepository, 'findLatestTokenCreatedAt').mockImplementation(
    async (userId, type) =>
      store.authTokens
        .filter((item) => item.userId === userId && item.type === type)
        .map((item) => item.createdAt)
        .sort((a, b) => b.getTime() - a.getTime())[0],
  )

  spyOn(billingRepository, 'findByUserId').mockImplementation(async (userId) =>
    store.subscriptions.find((item) => item.userId === userId),
  )

  function nextPeriodEnd(subscription: Subscription) {
    const start = new Date(
      Math.max(subscription.currentPeriodEnd?.getTime() ?? Date.now(), Date.now()),
    )

    if (subscription.cycle === 'annually') start.setFullYear(start.getFullYear() + 1)
    else start.setMonth(start.getMonth() + 1)

    return start
  }

  function changedRow({ userId, status, cycle, currentPeriodEnd }: Subscription) {
    return { userId, status, cycle, currentPeriodEnd }
  }

  function recordEvent(event: { id: string; type: string }) {
    if (store.billingEvents.has(event.id)) return false

    store.billingEvents.add(event.id)

    return true
  }

  function updateOnce(
    event: { id: string; type: string },
    find: (item: Subscription) => boolean,
    apply: (item: Subscription) => void,
  ) {
    if (!recordEvent(event)) return undefined

    const subscription = store.subscriptions.find(find)

    if (!subscription) return undefined

    apply(subscription)

    return changedRow(subscription)
  }

  spyOn(billingRepository, 'upsertPending').mockImplementation(
    async (userId, cycle, providerCustomerId) => {
      const existing = store.subscriptions.find((item) => item.userId === userId)

      if (existing) {
        Object.assign(existing, { cycle, status: 'pending', providerCustomerId, checkoutId: null })

        return { id: existing.id }
      }

      const created = buildSubscription({
        userId,
        cycle,
        status: 'pending',
        providerCustomerId,
        providerSubscriptionId: null,
        checkoutId: null,
        currentPeriodEnd: null,
      })

      store.subscriptions.push(created)

      return { id: created.id }
    },
  )

  spyOn(billingRepository, 'saveCheckout').mockImplementation(async (id, checkoutId) => {
    const subscription = store.subscriptions.find((item) => item.id === id)

    if (subscription) subscription.checkoutId = checkoutId
  })

  spyOn(billingRepository, 'activate').mockImplementation(
    async (event, id, providerSubscriptionId) =>
      updateOnce(
        event,
        (item) =>
          item.id === id &&
          (item.status !== 'active' ||
            !item.providerSubscriptionId ||
            item.providerSubscriptionId === providerSubscriptionId),
        (item) =>
          Object.assign(item, {
            providerSubscriptionId,
            status: 'active',
            cancelledAt: null,
            currentPeriodEnd: nextPeriodEnd(item),
          }),
      ),
  )

  spyOn(billingRepository, 'renew').mockImplementation(async (event, providerSubscriptionId) =>
    updateOnce(
      event,
      (item) =>
        item.providerSubscriptionId === providerSubscriptionId && item.status !== 'cancelled',
      (item) => Object.assign(item, { status: 'active', currentPeriodEnd: nextPeriodEnd(item) }),
    ),
  )

  spyOn(billingRepository, 'cancelByProvider').mockImplementation(
    async (event, providerSubscriptionId) =>
      updateOnce(
        event,
        (item) =>
          item.providerSubscriptionId === providerSubscriptionId && item.status !== 'cancelled',
        (item) => Object.assign(item, { status: 'cancelled', cancelledAt: new Date() }),
      ),
  )

  spyOn(billingRepository, 'findById').mockImplementation(async (id) =>
    store.subscriptions.find((item) => item.id === id),
  )

  spyOn(billingRepository, 'hasEvent').mockImplementation(async (id) => store.billingEvents.has(id))

  spyOn(billingRepository, 'recordEvent').mockImplementation(async (event) => recordEvent(event))

  spyOn(billingRepository, 'markCancelled').mockImplementation(async (userId) => {
    const subscription = store.subscriptions.find(
      (item) => item.userId === userId && item.status === 'active',
    )

    if (!subscription) return undefined

    Object.assign(subscription, { status: 'cancelled', cancelledAt: new Date() })

    return changedRow(subscription)
  })

  spyOn(usersRepository, 'findById').mockImplementation(async (id) => {
    const user = store.users.find((item) => item.id === id)

    return user && toPublicUser(user)
  })

  const findUser = (id: string) => store.users.find((item) => item.id === id)

  function replaceCodes(userId: string, codeHashes: string[]) {
    store.recoveryCodes = [
      ...store.recoveryCodes.filter((item) => item.userId !== userId),
      ...codeHashes.map((codeHash) => ({ userId, codeHash, usedAt: null })),
    ]
  }

  spyOn(twoFactorRepository, 'findUser').mockImplementation(async (id) => findUser(id))

  spyOn(twoFactorRepository, 'countRecoveryCodesLeft').mockImplementation(
    async (userId) =>
      store.recoveryCodes.filter((item) => item.userId === userId && !item.usedAt).length,
  )

  spyOn(twoFactorRepository, 'savePendingSecret').mockImplementation(
    async (userId, pendingSecret) => {
      const user = findUser(userId)

      if (!user || user.totpEnabledAt) return false

      user.totpPendingSecret = pendingSecret

      return true
    },
  )

  spyOn(twoFactorRepository, 'enable').mockImplementation(
    async (userId, keepSessionId, pendingSecret, step, codeHashes) => {
      const user = findUser(userId)

      if (!user || user.totpEnabledAt || user.totpPendingSecret !== pendingSecret) return false

      Object.assign(user, {
        totpSecret: pendingSecret,
        totpPendingSecret: null,
        totpEnabledAt: new Date(),
        totpLastStep: step,
        totpFailedAttempts: 0,
        totpLockedUntil: null,
      })

      replaceCodes(userId, codeHashes)

      for (const session of store.sessions) {
        if (session.userId === userId && session.id !== keepSessionId && !session.revokedAt) {
          session.revokedAt = new Date()
        }
      }

      return true
    },
  )

  spyOn(twoFactorRepository, 'consumeStep').mockImplementation(async (userId, secret, step) => {
    const user = findUser(userId)

    if (!user || user.totpSecret !== secret) return false

    if (user.totpLastStep !== null && user.totpLastStep >= step) return false

    user.totpLastStep = step

    return true
  })

  spyOn(twoFactorRepository, 'useRecoveryCode').mockImplementation(async (userId, codeHash) => {
    const code = store.recoveryCodes.find(
      (item) => item.userId === userId && item.codeHash === codeHash && !item.usedAt,
    )

    if (!code || !findUser(userId)?.totpEnabledAt) return false

    code.usedAt = new Date()

    return true
  })

  spyOn(twoFactorRepository, 'registerFailure').mockImplementation(
    async (userId, maxAttempts, lockMinutes) => {
      const user = findUser(userId)

      if (!user) return

      if (user.totpFailedAttempts + 1 >= maxAttempts) {
        user.totpFailedAttempts = 0

        user.totpLockedUntil = new Date(Date.now() + lockMinutes * 60_000)

        return
      }

      user.totpFailedAttempts += 1
    },
  )

  spyOn(twoFactorRepository, 'clearFailures').mockImplementation(async (userId) => {
    const user = findUser(userId)

    if (user) Object.assign(user, { totpFailedAttempts: 0, totpLockedUntil: null })
  })

  spyOn(twoFactorRepository, 'replaceRecoveryCodes').mockImplementation(
    async (userId, secret, codeHashes) => {
      if (findUser(userId)?.totpSecret === secret) replaceCodes(userId, codeHashes)
    },
  )

  spyOn(twoFactorRepository, 'disable').mockImplementation(async (userId, secret) => {
    const user = findUser(userId)

    if (!user || user.totpSecret !== secret) return false

    Object.assign(user, {
      totpSecret: null,
      totpPendingSecret: null,
      totpEnabledAt: null,
      totpLastStep: null,
      totpFailedAttempts: 0,
      totpLockedUntil: null,
    })

    store.recoveryCodes = store.recoveryCodes.filter((item) => item.userId !== userId)

    return true
  })

  spyOn(usersRepository, 'findWithPassword').mockImplementation(async (id) =>
    store.users.find((item) => item.id === id),
  )

  spyOn(usersRepository, 'deleteWithData').mockImplementation(async (userId, expectedHash) => {
    const owner = store.users.find((item) => item.id === userId)

    if (!owner || owner.passwordHash !== expectedHash) return undefined

    const page = store.pages.find((item) => item.userId === userId)

    const mediaKeys = store.media.filter((item) => item.pageId === page?.id).map((item) => item.key)

    const isOwn = (row: { pageId: string }) => row.pageId === page?.id

    store.analytics.views = store.analytics.views.filter((row) => !isOwn(row))

    store.analytics.links = store.analytics.links.filter((row) => !isOwn(row))

    store.analytics.social = store.analytics.social.filter((row) => !isOwn(row))

    store.media = store.media.filter((item) => !isOwn(item))

    store.links = store.links.filter((item) => !isOwn(item))

    store.pages = store.pages.filter((item) => item.userId !== userId)

    store.sessions = store.sessions.filter((item) => item.userId !== userId)

    store.authTokens = store.authTokens.filter((item) => item.userId !== userId)

    store.customDomains = store.customDomains.filter((item) => item.userId !== userId)

    store.users = store.users.filter((item) => item.id !== userId)

    return { page: page && { username: page.username, revision: page.revision }, mediaKeys }
  })

  spyOn(pagesRepository, 'findByUserId').mockImplementation(async (userId) =>
    store.pages.find((page) => page.userId === userId),
  )

  spyOn(pagesRepository, 'findByUsername').mockImplementation(async (username) =>
    store.pages.find((page) => page.username === username),
  )

  spyOn(pagesRepository, 'findPublishedById').mockImplementation(async (id) =>
    store.pages.find((page) => page.id === id && page.isPublished),
  )

  spyOn(pagesRepository, 'findRefByUsername').mockImplementation(async (username) => {
    const page = store.pages.find((item) => item.username === username)

    return page && { id: page.id, revision: page.revision, isPublished: page.isPublished }
  })

  spyOn(pagesRepository, 'create').mockImplementation(async ({ id, ...data }) => {
    const page = buildPage({ ...data, ...(id && { id }) })

    store.pages.push(page)

    return page
  })

  spyOn(pagesRepository, 'updateByUserId').mockImplementation(async (userId, changes) => {
    const page = store.pages.find((item) => item.userId === userId)

    return page && Object.assign(page, changes, { revision: nextRevision(), updatedAt: new Date() })
  })

  spyOn(pagesRepository, 'deleteByUserId').mockImplementation(async (userId) => {
    const page = store.pages.find((item) => item.userId === userId)

    if (!page) return undefined

    store.pages = store.pages.filter((item) => item !== page)

    store.links = store.links.filter((link) => link.pageId !== page.id)

    return {
      id: page.id,
      username: page.username,
      revision: page.revision,
      isPublished: page.isPublished,
    }
  })

  spyOn(linksRepository, 'findByPageId').mockImplementation(async (pageId) =>
    store.links.filter((link) => link.pageId === pageId).sort(byPosition),
  )

  spyOn(linksRepository, 'findActiveByPageId').mockImplementation(async (pageId) =>
    store.links.filter((link) => link.pageId === pageId && link.isActive).sort(byPosition),
  )

  spyOn(linksRepository, 'findPublicTarget').mockImplementation(async (id) => {
    const link = store.links.find((item) => item.id === id)

    const page = link && store.pages.find((item) => item.id === link.pageId && item.isPublished)

    return link && page
      ? {
          url: link.url,
          pageId: page.id,
          username: page.username,
          isActive: link.isActive,
          startsAt: link.startsAt,
          endsAt: link.endsAt,
        }
      : undefined
  })

  spyOn(linksRepository, 'create').mockImplementation(async ({ id, ...data }) => {
    const link = buildLink({
      ...data,
      ...(id && { id }),
      startsAt: data.startsAt ?? null,
      endsAt: data.endsAt ?? null,
    })

    store.links.push(link)

    return { link, page: bumpRevision(store, data.pageId) }
  })

  spyOn(linksRepository, 'update').mockImplementation(async (id, pageId, changes) => {
    const link = store.links.find((item) => item.id === id && item.pageId === pageId)

    return {
      link: link && Object.assign(link, changes, { updatedAt: new Date() }),
      page: bumpRevision(store, pageId),
    }
  })

  spyOn(linksRepository, 'delete').mockImplementation(async (id, pageId) => {
    const link = store.links.find((item) => item.id === id && item.pageId === pageId)

    if (link) store.links = store.links.filter((item) => item !== link)

    return { link: link && { id: link.id }, page: bumpRevision(store, pageId) }
  })

  spyOn(linksRepository, 'reorder').mockImplementation(async (pageId, linkIds) => {
    for (const link of store.links) {
      const position = linkIds.indexOf(link.id)

      if (link.pageId === pageId && position >= 0) link.position = position
    }

    return bumpRevision(store, pageId)
  })

  spyOn(mediaRepository, 'findById').mockImplementation(async (id, pageId) =>
    store.media.find((media) => media.id === id && media.pageId === pageId),
  )

  spyOn(mediaRepository, 'findReadyOwned').mockImplementation(async (id, pageId, type) =>
    store.media.find(
      (media) =>
        media.id === id &&
        media.pageId === pageId &&
        media.type === type &&
        media.status === 'ready',
    ),
  )

  spyOn(mediaRepository, 'findReadyByIds').mockImplementation(async (ids) =>
    store.media.filter((media) => ids.includes(media.id) && media.status === 'ready'),
  )

  spyOn(mediaRepository, 'countPending').mockImplementation(
    async (pageId) =>
      store.media.filter((media) => media.pageId === pageId && media.status === 'pending').length,
  )

  spyOn(mediaRepository, 'create').mockImplementation(async (data) => {
    const media = buildMedia(data)

    store.media.push(media)

    return media
  })

  spyOn(mediaRepository, 'markReady').mockImplementation(async (id, pageId, changes) => {
    const media = store.media.find(
      (item) => item.id === id && item.pageId === pageId && item.status === 'pending',
    )

    return media && Object.assign(media, changes, { status: 'ready' as const })
  })

  spyOn(mediaRepository, 'markFailed').mockImplementation(async (id, pageId) => {
    const media = store.media.find(
      (item) => item.id === id && item.pageId === pageId && item.status === 'pending',
    )

    if (media) media.status = 'failed'
  })

  spyOn(mediaRepository, 'delete').mockImplementation(async (id, pageId) => {
    const media = store.media.find((item) => item.id === id && item.pageId === pageId)

    if (!media) return undefined

    store.media = store.media.filter((item) => item !== media)

    return { id: media.id }
  })

  const { analytics } = store

  spyOn(analyticsRepository, 'sumViews').mockImplementation(async (pageId, from, to) =>
    sumCounts(analytics.views.filter((row) => inRange(row, pageId, from, to))),
  )

  spyOn(analyticsRepository, 'sumQrViews').mockImplementation(async (pageId, from, to) =>
    sumCounts(analytics.qrViews.filter((row) => inRange(row, pageId, from, to))),
  )

  spyOn(analyticsRepository, 'sumLinkClicks').mockImplementation(async (pageId, from, to) =>
    sumCounts(analytics.links.filter((row) => inRange(row, pageId, from, to))),
  )

  spyOn(analyticsRepository, 'sumSocialClicks').mockImplementation(async (pageId, from, to) =>
    sumCounts(analytics.social.filter((row) => inRange(row, pageId, from, to))),
  )

  spyOn(analyticsRepository, 'viewsByDay').mockImplementation(async (pageId, from, to) =>
    analytics.views.filter((row) => inRange(row, pageId, from, to)),
  )

  spyOn(analyticsRepository, 'clicksByDay').mockImplementation(async (pageId, from, to) =>
    [...analytics.links, ...analytics.social].filter((row) => inRange(row, pageId, from, to)),
  )

  spyOn(analyticsRepository, 'topLinks').mockImplementation(async (pageId, from, to) =>
    groupCounts(
      analytics.links.filter((row) => inRange(row, pageId, from, to)),
      (row) => row.linkId,
    ).map(([linkId, clicks]) => {
      const link = store.links.find((item) => item.id === linkId && item.pageId === pageId)

      return { linkId, title: link?.title ?? null, url: link?.url ?? null, clicks }
    }),
  )

  spyOn(analyticsRepository, 'topSocial').mockImplementation(async (pageId, from, to) =>
    groupCounts(
      analytics.social.filter((row) => inRange(row, pageId, from, to)),
      (row) => row.platform,
    ).map(([platform, clicks]) => ({ platform, clicks })),
  )

  const findDomain = (find: (item: CustomDomain) => boolean) => store.customDomains.find(find)

  spyOn(domainsRepository, 'findByUserId').mockImplementation(async (userId) =>
    findDomain((item) => item.userId === userId),
  )

  spyOn(domainsRepository, 'findVerifiedByHostname').mockImplementation(async (hostname) =>
    findDomain((item) => item.hostname === hostname && item.ownerVerifiedAt !== null),
  )

  spyOn(domainsRepository, 'create').mockImplementation(async (values) => {
    const domain = buildCustomDomain({ ...values, status: 'pending_owner' })

    store.customDomains.push(domain)

    return domain
  })

  spyOn(domainsRepository, 'update').mockImplementation(async (id, changes) => {
    const domain = findDomain((item) => item.id === id)

    const takenByOther =
      domain &&
      changes.ownerVerifiedAt &&
      findDomain(
        (item) =>
          item.id !== id && item.hostname === domain.hostname && item.ownerVerifiedAt !== null,
      )

    if (takenByOther) {
      throw new Error('duplicate', {
        cause: { code: '23505', constraint: 'custom_domains_hostname_verified_unique' },
      })
    }

    if (domain) Object.assign(domain, changes, { updatedAt: new Date() })

    return domain
  })

  spyOn(domainsRepository, 'activate').mockImplementation(async (id, checkedAt) => {
    const domain = findDomain((item) => item.id === id)

    if (!domain) return { domain: undefined, firstActivation: false }

    const firstActivation = domain.activatedAt === null

    Object.assign(domain, {
      status: 'active',
      lastError: null,
      lastCheckedAt: checkedAt,
      activatedAt: domain.activatedAt ?? checkedAt,
    })

    return { domain, firstActivation }
  })

  spyOn(domainsRepository, 'deleteByUserId').mockImplementation(async (userId) => {
    const domain = findDomain((item) => item.userId === userId)

    store.customDomains = store.customDomains.filter((item) => item.userId !== userId)

    return domain
  })

  spyOn(domainsRepository, 'findActiveHostname').mockImplementation(
    async (userId) =>
      findDomain((item) => item.userId === userId && item.status === 'active')?.hostname ?? null,
  )

  spyOn(domainsRepository, 'findActiveOwner').mockImplementation(async (hostname) => {
    const domain = findDomain((item) => item.hostname === hostname && item.status === 'active')

    const page = domain && store.pages.find((item) => item.userId === domain.userId)

    return domain && page ? { userId: domain.userId, username: page.username } : undefined
  })

  spyOn(domainsRepository, 'findDue').mockImplementation(
    async (pendingBefore, activeBefore, limit) =>
      store.customDomains
        .filter((item) => {
          const checked = item.lastCheckedAt?.getTime() ?? Number.NEGATIVE_INFINITY

          if (item.status === 'active') return checked < activeBefore.getTime()

          return item.status !== 'error' && checked < pendingBefore.getTime()
        })
        .sort(
          (a, b) =>
            (a.lastCheckedAt?.getTime() ?? Number.NEGATIVE_INFINITY) -
            (b.lastCheckedAt?.getTime() ?? Number.NEGATIVE_INFINITY),
        )
        .slice(0, limit),
  )

  return store
}
