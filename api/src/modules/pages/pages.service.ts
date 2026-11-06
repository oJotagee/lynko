import { env } from '../../config/env'
import { cacheRedis } from '../../db/redis'
import type { pageSchema } from '../../db/schema'
import { getUniqueViolation } from '../../shared/db-errors'
import { ConflictError, NotFoundError } from '../../shared/errors'
import { linksRepository } from '../links/links.repository'
import type { MediaType } from '../media/media.dto'
import { mediaRepository } from '../media/media.repository'
import { getMediaUrl, mediaService } from '../media/media.service'
import { getBackgroundMediaId, resolveAppearance } from './pages.appearance'
import {
  cacheMetrics,
  createPublicPageCache,
  FALLBACK_LIMIT,
  NOT_FOUND_TTL_MS,
  sharedCacheLogger,
  toInvalidateEntry,
} from './pages.cache'
import { createPublicPageCacheRepository } from './pages.cache.repository'
import type { CreatePageBody, UpdatePageBody } from './pages.dto'
import { pagesRepository } from './pages.repository'
import type { SocialLink } from './pages.social'

type Page = typeof pageSchema.$inferSelect

const PAGE_ALREADY_EXISTS = 'User already has a page'

const USERNAME_TAKEN = 'Username already taken'

function toConflictError(error: unknown) {
  const constraint = getUniqueViolation(error)

  if (constraint === 'pages_username_unique') return new ConflictError(USERNAME_TAKEN)

  if (constraint === 'pages_user_id_unique') return new ConflictError(PAGE_ALREADY_EXISTS)

  return error
}

async function toPageResponse(page: Page) {
  const appearance = resolveAppearance(page)

  const backgroundMediaId = getBackgroundMediaId(appearance)

  const media = await mediaRepository.findReadyByIds(
    [page.avatarMediaId, backgroundMediaId].filter((id) => id !== null),
  )

  function urlOf(id: string | null) {
    const item = media.find((entry) => entry.id === id && entry.pageId === page.id)

    return item ? getMediaUrl(item.key) : null
  }

  return {
    ...page,
    appearance,
    avatarUrl: urlOf(page.avatarMediaId) ?? page.avatarUrl,
    backgroundImageUrl: urlOf(backgroundMediaId),
  }
}

async function findMineOrThrow(userId: string) {
  const page = await pagesRepository.findByUserId(userId)

  if (!page) {
    throw new NotFoundError('Page not found')
  }

  return page
}

async function assertOwnedReadyMedia(pageId: string, id: string, type: MediaType) {
  if (!(await mediaRepository.findReadyOwned(id, pageId, type))) {
    throw new NotFoundError('Media not found')
  }
}

async function discardReplaced(pageId: string, previous: string | null, next: string | null) {
  if (!previous || previous === next) return

  try {
    await mediaService.discard(pageId, previous)
  } catch (error) {
    console.error('Failed to remove replaced media', previous, error)
  }
}

function toPublicSocialLinks(socialLinks: SocialLink[]) {
  return socialLinks.filter((link) => link.isActive).map(({ platform, url }) => ({ platform, url }))
}

async function loadPublicPage(pageId: string) {
  const page = await pagesRepository.findPublishedById(pageId)

  if (!page) return undefined

  return {
    ...(await toPageResponse(page)),
    socialLinks: toPublicSocialLinks(page.socialLinks),
    links: await linksRepository.findActiveByPageId(page.id),
  }
}

export const publicPageCache = createPublicPageCache({
  repository: cacheRedis && createPublicPageCacheRepository(cacheRedis),
  config: {
    contentTtlMs: env.PUBLIC_PAGE_CACHE_TTL * 1000,
    refTtlMs: env.PUBLIC_PAGE_REF_TTL * 1000,
    notFoundTtlMs: NOT_FOUND_TTL_MS,
    refreshThresholdMs: env.PUBLIC_PAGE_REFRESH_THRESHOLD * 1000,
    lockTtlMs: env.PUBLIC_PAGE_LOCK_TTL_MS,
    waitTimeoutMs: env.PUBLIC_PAGE_WAIT_TIMEOUT_MS,
    fallbackLimit: FALLBACK_LIMIT,
  },
  resolve: (username) => pagesRepository.findRefByUsername(username),
  load: loadPublicPage,
  metrics: cacheMetrics,
  log: sharedCacheLogger,
})

export const pagesService = {
  async create(userId: string, data: CreatePageBody) {
    if (await pagesRepository.findByUserId(userId)) {
      throw new ConflictError(PAGE_ALREADY_EXISTS)
    }

    if (await pagesRepository.findByUsername(data.username)) {
      throw new ConflictError(USERNAME_TAKEN)
    }

    try {
      const page = await pagesRepository.create({ ...data, userId })

      if (!page) throw new Error('Failed to create page')

      await publicPageCache.invalidate([toInvalidateEntry(page)])

      return toPageResponse(page)
    } catch (error) {
      throw toConflictError(error)
    }
  },

  async getMine(userId: string) {
    return toPageResponse(await findMineOrThrow(userId))
  },

  async updateMine(userId: string, { theme, ...changes }: UpdatePageBody) {
    const current = await findMineOrThrow(userId)

    if (changes.username && changes.username !== current.username) {
      const owner = await pagesRepository.findByUsername(changes.username)

      if (owner) {
        throw new ConflictError(USERNAME_TAKEN)
      }
    }

    const previousUsername = current.username

    const previousAvatar = current.avatarMediaId

    const nextAvatar = changes.avatarMediaId === undefined ? previousAvatar : changes.avatarMediaId

    const previousBackground = getBackgroundMediaId(current.appearance)

    const nextBackground = changes.appearance
      ? getBackgroundMediaId(changes.appearance)
      : previousBackground

    if (nextAvatar && nextAvatar !== previousAvatar) {
      await assertOwnedReadyMedia(current.id, nextAvatar, 'avatar')
    }

    if (nextBackground && nextBackground !== previousBackground) {
      await assertOwnedReadyMedia(current.id, nextBackground, 'background')
    }

    let page: Page | undefined

    try {
      page = await pagesRepository.updateByUserId(userId, {
        ...changes,
        ...(theme && { theme: { ...current.theme, ...theme } }),
      })
    } catch (error) {
      throw toConflictError(error)
    }

    if (!page) throw new NotFoundError('Page not found')

    await discardReplaced(current.id, previousAvatar, nextAvatar)

    await discardReplaced(current.id, previousBackground, nextBackground)

    await publicPageCache.invalidate([
      toInvalidateEntry(page),
      ...(previousUsername === page.username
        ? []
        : [{ username: previousUsername, revision: page.revision }]),
    ])

    return toPageResponse(page)
  },

  async deleteMine(userId: string) {
    const deleted = await pagesRepository.deleteByUserId(userId)

    if (!deleted) {
      throw new NotFoundError('Page not found')
    }

    await publicPageCache.invalidate([{ username: deleted.username, revision: deleted.revision }])
  },

  async getPublic(username: string) {
    const page = await publicPageCache.get(username)

    if (!page) {
      throw new NotFoundError('Page not found')
    }

    return page
  },

  async getPreview(userId: string) {
    const page = await pagesService.getMine(userId)

    return {
      ...page,
      socialLinks: toPublicSocialLinks(page.socialLinks),
      links: await linksRepository.findActiveByPageId(page.id),
    }
  },
}
