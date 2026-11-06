import { describe, expect, it, mock } from 'bun:test'
import { defaultPageAppearance } from '../../../../src/modules/pages/pages.appearance'
import {
  createPublicPageCache,
  type PageRef,
  type PublicPage,
  type PublicPageCacheConfig,
} from '../../../../src/modules/pages/pages.cache'
import type { PublicPageCacheRepository } from '../../../../src/modules/pages/pages.cache.repository'
import { defaultPageTheme } from '../../../../src/modules/pages/pages.theme'
import { ServiceUnavailableError } from '../../../../src/shared/errors'

const config: PublicPageCacheConfig = {
  contentTtlMs: 60_000,
  refTtlMs: 60_000,
  notFoundTtlMs: 5_000,
  refreshThresholdMs: 30_000,
  lockTtlMs: 1_000,
  waitTimeoutMs: 200,
  fallbackLimit: 20,
}

function buildPublicPage(id: string, bio = 'v1'): PublicPage {
  return {
    id,
    username: 'maria',
    title: 'Maria Silva',
    bio,
    avatarUrl: null,
    backgroundImageUrl: null,
    theme: defaultPageTheme,
    appearance: defaultPageAppearance,
    socialLinks: [],
    links: [],
  }
}

function deferred<T>() {
  let resolve!: (value: T) => void

  const promise = new Promise<T>((done) => {
    resolve = done
  })

  return { promise, resolve }
}

function brokenRepository(): PublicPageCacheRepository {
  const fail = () => Promise.reject(new Error('redis down'))

  return {
    read: fail,
    readContent: fail,
    tryLock: fail,
    setRef: fail,
    publish: fail,
    release: fail,
  }
}

function memoryRepository(): PublicPageCacheRepository {
  const values = new Map<string, string>()

  const locks = new Set<string>()

  return {
    async read(username) {
      const ref = values.get(`ref:${username}`) ?? null

      const content = ref ? (values.get(`content:${ref}`) ?? null) : null

      return { ref, content, pttl: content ? 3_600_000 : -2 }
    },

    async readContent(pageId, revision) {
      const content = values.get(`content:${pageId}:${revision}`) ?? null

      return { content, pttl: content ? 3_600_000 : -2 }
    },

    async tryLock(username) {
      if (locks.has(username)) return false

      locks.add(username)

      return true
    },

    async setRef(username, value) {
      values.set(`ref:${username}`, value)

      return true
    },

    async publish(input) {
      const ref = `${input.pageId}:${input.revision}`

      values.set(`content:${ref}`, input.content)

      values.set(`ref:${input.username}`, ref)

      return 1
    },

    async release(username) {
      locks.delete(username)
    },
  }
}

describe('public page cache', () => {
  const pageId = crypto.randomUUID()

  const published: PageRef = { id: pageId, revision: 1, isPublished: true }

  describe('fallback', () => {
    it('reads from the database when Redis fails', async () => {
      const load = mock(async () => buildPublicPage(pageId))

      const cache = createPublicPageCache({
        repository: brokenRepository(),
        config,
        resolve: async () => published,
        load,
      })

      expect((await cache.get('maria'))?.bio).toBe('v1')

      expect(cache.metrics.snapshot().counters.fallback).toBe(1)
    })

    it('reads from the database when there is no Redis configured', async () => {
      const cache = createPublicPageCache({
        repository: null,
        config,
        resolve: async () => published,
        load: async () => buildPublicPage(pageId),
      })

      expect((await cache.get('maria'))?.bio).toBe('v1')
    })

    it('returns undefined for a page that is not published', async () => {
      const cache = createPublicPageCache({
        repository: null,
        config,
        resolve: async () => ({ ...published, isPublished: false }),
        load: async () => buildPublicPage(pageId),
      })

      expect(await cache.get('maria')).toBeUndefined()
    })

    it('runs a single load for concurrent reads of the same page', async () => {
      const gate = deferred<void>()

      const load = mock(async () => {
        await gate.promise

        return buildPublicPage(pageId)
      })

      const cache = createPublicPageCache({
        repository: brokenRepository(),
        config,
        resolve: async () => published,
        load,
      })

      const reads = Array.from({ length: 50 }, () => cache.get('maria'))

      gate.resolve()

      const pages = await Promise.all(reads)

      expect(load).toHaveBeenCalledTimes(1)

      expect(pages.every((page) => page?.bio === 'v1')).toBe(true)
    })

    it('rejects with 503 when too many different pages hit the database at once', async () => {
      const gate = deferred<void>()

      const cache = createPublicPageCache({
        repository: null,
        config,
        resolve: async () => published,
        load: async () => {
          await gate.promise

          return buildPublicPage(pageId)
        },
      })

      const accepted = Array.from({ length: config.fallbackLimit }, (_, index) =>
        cache.get(`page-${index}`),
      )

      await expect(cache.get('one-too-many')).rejects.toBeInstanceOf(ServiceUnavailableError)

      gate.resolve()

      expect(await Promise.all(accepted)).toHaveLength(config.fallbackLimit)

      expect((await cache.get('after-release'))?.bio).toBe('v1')
    })

    it('does not fall back or retry when the database itself fails', async () => {
      const load = mock(async () => {
        throw new Error('postgres down')
      })

      const cache = createPublicPageCache({
        repository: memoryRepository(),
        config,
        resolve: async () => published,
        load,
      })

      await expect(cache.get('maria')).rejects.toThrow('postgres down')

      expect(load).toHaveBeenCalledTimes(1)

      expect(cache.metrics.snapshot().counters.fallback).toBe(0)
    })
  })

  describe('with a working repository', () => {
    it('serves later reads from the cache', async () => {
      const load = mock(async () => buildPublicPage(pageId))

      const cache = createPublicPageCache({
        repository: memoryRepository(),
        config,
        resolve: async () => published,
        load,
      })

      for (let index = 0; index < 10; index += 1) await cache.get('maria')

      expect(load).toHaveBeenCalledTimes(1)

      expect(cache.metrics.snapshot().counters).toMatchObject({ miss: 1, hit: 9 })
    })

    it('caches a missing page', async () => {
      const resolve = mock(async () => undefined)

      const cache = createPublicPageCache({
        repository: memoryRepository(),
        config,
        resolve,
        load: async () => buildPublicPage(pageId),
      })

      expect(await cache.get('ghost')).toBeUndefined()

      expect(await cache.get('ghost')).toBeUndefined()

      expect(resolve).toHaveBeenCalledTimes(1)
    })

    it('does not break the write when the invalidation fails', async () => {
      const cache = createPublicPageCache({
        repository: brokenRepository(),
        config,
        resolve: async () => published,
        load: async () => buildPublicPage(pageId),
      })

      await expect(
        cache.invalidate([{ username: 'maria', pageId, revision: 2 }]),
      ).resolves.toBeUndefined()

      expect(cache.metrics.snapshot().counters.invalidationFailed).toBe(1)
    })
  })
})
