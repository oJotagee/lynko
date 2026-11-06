import { spyOn } from 'bun:test'

import { analyticsRepository } from '../../../src/modules/analytics/analytics.repository'
import { authRepository } from '../../../src/modules/auth/auth.repository'
import { linksRepository } from '../../../src/modules/links/links.repository'
import { mediaRepository } from '../../../src/modules/media/media.repository'
import { pagesRepository } from '../../../src/modules/pages/pages.repository'
import { usersRepository } from '../../../src/modules/users/users.repository'
import {
  buildLink,
  buildMedia,
  buildPage,
  buildSession,
  buildUser,
  type Link,
  type Media,
  nextRevision,
  type Page,
  type Session,
  type User,
} from './builders'

function toPublicUser({ passwordHash: _passwordHash, ...user }: User) {
  return user
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

export function useInMemoryRepositories() {
  const store = {
    users: [] as User[],
    sessions: [] as Session[],
    pages: [] as Page[],
    links: [] as Link[],
    media: [] as Media[],
    analytics: {
      views: [] as DailyRow[],
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

  spyOn(authRepository, 'createSession').mockImplementation(async ({ id, userId, ...data }) => {
    store.sessions.push(buildSession({ ...(id && { id }), userId, ...data, revokedAt: null }))
  })

  spyOn(authRepository, 'findSessionById').mockImplementation(async (id) =>
    store.sessions.find((session) => session.id === id),
  )

  spyOn(authRepository, 'rotateSessionToken').mockImplementation(
    async (id, refreshTokenHash, expiresAt) => {
      const session = store.sessions.find((item) => item.id === id && !item.revokedAt)

      if (session) Object.assign(session, { refreshTokenHash, expiresAt })
    },
  )

  spyOn(authRepository, 'revokeSession').mockImplementation(async (id) => {
    const session = store.sessions.find((item) => item.id === id && !item.revokedAt)

    if (session) session.revokedAt = new Date()
  })

  spyOn(usersRepository, 'findById').mockImplementation(async (id) => {
    const user = store.users.find((item) => item.id === id)

    return user && toPublicUser(user)
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
    const link = store.links.find((item) => item.id === id && item.isActive)

    const page = link && store.pages.find((item) => item.id === link.pageId && item.isPublished)

    return link && page ? { url: link.url, pageId: page.id } : undefined
  })

  spyOn(linksRepository, 'create').mockImplementation(async ({ id, ...data }) => {
    const link = buildLink({ ...data, ...(id && { id }) })

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

  return store
}
