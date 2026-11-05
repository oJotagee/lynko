import { spyOn } from 'bun:test'

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
  type Page,
  type Session,
  type User,
} from './builders'

function toPublicUser({ passwordHash: _passwordHash, ...user }: User) {
  return user
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

  spyOn(pagesRepository, 'findPublishedByUsername').mockImplementation(async (username) =>
    store.pages.find((page) => page.username === username && page.isPublished),
  )

  spyOn(pagesRepository, 'create').mockImplementation(async ({ id, ...data }) => {
    const page = buildPage({ ...data, ...(id && { id }) })

    store.pages.push(page)

    return page
  })

  spyOn(pagesRepository, 'updateByUserId').mockImplementation(async (userId, changes) => {
    const page = store.pages.find((item) => item.userId === userId)

    return page && Object.assign(page, changes, { updatedAt: new Date() })
  })

  spyOn(pagesRepository, 'deleteByUserId').mockImplementation(async (userId) => {
    const page = store.pages.find((item) => item.userId === userId)

    if (!page) return undefined

    store.pages = store.pages.filter((item) => item !== page)

    store.links = store.links.filter((link) => link.pageId !== page.id)

    return { id: page.id }
  })

  spyOn(linksRepository, 'findByPageId').mockImplementation(async (pageId) =>
    store.links.filter((link) => link.pageId === pageId).sort(byPosition),
  )

  spyOn(linksRepository, 'findActiveByPageId').mockImplementation(async (pageId) =>
    store.links.filter((link) => link.pageId === pageId && link.isActive).sort(byPosition),
  )

  spyOn(linksRepository, 'create').mockImplementation(async ({ id, ...data }) => {
    const link = buildLink({ ...data, ...(id && { id }) })

    store.links.push(link)

    return link
  })

  spyOn(linksRepository, 'update').mockImplementation(async (id, pageId, changes) => {
    const link = store.links.find((item) => item.id === id && item.pageId === pageId)

    return link && Object.assign(link, changes, { updatedAt: new Date() })
  })

  spyOn(linksRepository, 'delete').mockImplementation(async (id, pageId) => {
    const link = store.links.find((item) => item.id === id && item.pageId === pageId)

    if (!link) return undefined

    store.links = store.links.filter((item) => item !== link)

    return { id: link.id }
  })

  spyOn(linksRepository, 'reorder').mockImplementation(async (pageId, linkIds) => {
    for (const link of store.links) {
      const position = linkIds.indexOf(link.id)

      if (link.pageId === pageId && position >= 0) link.position = position
    }
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

  return store
}
