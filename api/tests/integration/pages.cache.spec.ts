import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import type { Redis } from 'ioredis'

import { createRedis } from '../../src/db/redis'
import { defaultPageAppearance } from '../../src/modules/pages/pages.appearance'
import {
  createPublicPageCache,
  type PageRef,
  type PublicPage,
  type PublicPageCacheConfig,
} from '../../src/modules/pages/pages.cache'
import {
  cacheKeys,
  createPublicPageCacheRepository,
} from '../../src/modules/pages/pages.cache.repository'
import { defaultPageTheme } from '../../src/modules/pages/pages.theme'

const url = process.env.REDIS_TEST_URL ?? ''

const baseConfig: PublicPageCacheConfig = {
  contentTtlMs: 60_000,
  refTtlMs: 60_000,
  notFoundTtlMs: 5_000,
  refreshThresholdMs: 30_000,
  lockTtlMs: 5_000,
  waitTimeoutMs: 3_000,
  fallbackLimit: 20,
}

function wait(ms: number) {
  return new Promise<void>((done) => setTimeout(done, ms))
}

function deferred<T>() {
  let resolve!: (value: T) => void

  const promise = new Promise<T>((done) => {
    resolve = done
  })

  return { promise, resolve }
}

async function connect() {
  const redis = createRedis(url)

  if (redis.status !== 'ready') await new Promise<void>((done) => redis.once('ready', () => done()))

  return redis
}

function buildPublicPage(id: string, username: string, bio: string): PublicPage {
  return {
    id,
    username,
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

class FakeDatabase {
  readonly pageId = crypto.randomUUID()

  revision = 1

  bio = 'v1'

  published = true

  exists = true

  resolveCalls = 0

  loadCalls = 0

  loadDelayMs = 0

  gate: Promise<void> | null = null

  resolve = async (_username: string): Promise<PageRef | undefined> => {
    this.resolveCalls += 1

    if (!this.exists) return undefined

    return { id: this.pageId, revision: this.revision, isPublished: this.published }
  }

  load = async (pageId: string): Promise<PublicPage | undefined> => {
    this.loadCalls += 1

    const bio = this.bio

    if (this.gate) await this.gate

    if (this.loadDelayMs) await wait(this.loadDelayMs)

    if (!this.exists || !this.published) return undefined

    return buildPublicPage(pageId, 'maria', bio)
  }
}

describe.skipIf(!url)('public page cache with real Redis', () => {
  const opened: Redis[] = []

  let admin: Redis

  let database: FakeDatabase

  async function instance(
    overrides: Partial<PublicPageCacheConfig> = {},
    load?: FakeDatabase['load'],
  ) {
    const redis = await connect()

    opened.push(redis)

    return createPublicPageCache({
      repository: createPublicPageCacheRepository(redis),
      config: { ...baseConfig, ...overrides },
      resolve: database.resolve,
      load: load ?? database.load,
    })
  }

  beforeEach(async () => {
    admin = await connect()

    opened.push(admin)

    await admin.flushdb()

    database = new FakeDatabase()
  })

  afterEach(() => {
    for (const redis of opened.splice(0)) redis.disconnect()
  })

  it('serves 100 sequential reads from the cache without touching the database', async () => {
    const cache = await instance()

    await cache.get('maria')

    expect(database.loadCalls).toBe(1)

    for (let index = 0; index < 100; index += 1) {
      expect((await cache.get('maria'))?.bio).toBe('v1')
    }

    expect(database.loadCalls).toBe(1)

    expect(database.resolveCalls).toBe(1)
  })

  it('rebuilds once for 100 concurrent reads inside the refresh window', async () => {
    const caches = await Promise.all([instance(), instance(), instance()])

    await caches[0]?.get('maria')

    database.bio = 'v2'

    database.loadDelayMs = 50

    await admin.pexpire(cacheKeys.content(database.pageId, 1), 20_000)

    const results = await Promise.all(
      Array.from({ length: 100 }, (_, index) => caches[index % 3]?.get('maria')),
    )

    expect(database.loadCalls).toBe(2)

    expect(results.every((page) => page?.bio === 'v2')).toBe(true)

    expect(await admin.pttl(cacheKeys.content(database.pageId, 1))).toBeGreaterThan(30_000)
  })

  it('rebuilds once for 100 concurrent reads on a cache miss', async () => {
    const caches = await Promise.all([instance(), instance(), instance()])

    database.loadDelayMs = 50

    const results = await Promise.all(
      Array.from({ length: 100 }, (_, index) => caches[index % 3]?.get('maria')),
    )

    expect(database.loadCalls).toBe(1)

    expect(results.every((page) => page?.bio === 'v1')).toBe(true)
  })

  it('shows the new data after an invalidation made by another instance', async () => {
    const [reader, writer] = await Promise.all([instance(), instance()])

    expect((await reader?.get('maria'))?.bio).toBe('v1')

    database.bio = 'v2'

    database.revision = 2

    await writer?.invalidate([{ username: 'maria', pageId: database.pageId, revision: 2 }])

    expect((await reader?.get('maria'))?.bio).toBe('v2')
  })

  it('does not let a rebuild started before an update publish stale data', async () => {
    const [owner, writer] = await Promise.all([instance(), instance()])

    const gate = deferred<void>()

    database.gate = gate.promise

    const pending = owner?.get('maria')

    await wait(100)

    database.bio = 'v2'

    database.revision = 2

    database.gate = null

    await writer?.invalidate([{ username: 'maria', pageId: database.pageId, revision: 2 }])

    gate.resolve()

    expect((await pending)?.bio).toBe('v2')

    expect(await admin.get(cacheKeys.ref('maria'))).toBe(`${database.pageId}:2`)

    expect(await admin.exists(cacheKeys.content(database.pageId, 1))).toBe(0)

    expect((await owner?.get('maria'))?.bio).toBe('v2')
  })

  it('never makes readers wait past the timeout when the lock owner hangs', async () => {
    const config = { lockTtlMs: 1_000, waitTimeoutMs: 200 }

    const hanging = await instance(config, () => new Promise<never>(() => undefined))

    const waiter = await instance(config)

    const recovered = await instance(config)

    void hanging.get('maria')

    await wait(100)

    const startedAt = Date.now()

    expect((await waiter.get('maria'))?.bio).toBe('v1')

    expect(Date.now() - startedAt).toBeLessThan(1_000)

    await wait(1_000)

    database.loadCalls = 0

    expect((await recovered.get('maria'))?.bio).toBe('v1')

    expect(database.loadCalls).toBe(1)

    expect(await admin.get(cacheKeys.lock('maria'))).toBeNull()
  })

  it('falls back to the database with a single load when Redis is down', async () => {
    const redis = await connect()

    opened.push(redis)

    const cache = createPublicPageCache({
      repository: createPublicPageCacheRepository(redis),
      config: baseConfig,
      resolve: database.resolve,
      load: database.load,
    })

    redis.disconnect()

    database.loadDelayMs = 30

    const results = await Promise.all(Array.from({ length: 50 }, () => cache.get('maria')))

    expect(database.loadCalls).toBe(1)

    expect(results.every((page) => page?.bio === 'v1')).toBe(true)

    expect(cache.metrics.snapshot().counters.fallback).toBe(1)
  })

  it('does not block other pages while one is rebuilding', async () => {
    const redis = await connect()

    opened.push(redis)

    const slowId = crypto.randomUUID()

    const fastId = crypto.randomUUID()

    const gate = deferred<void>()

    const cache = createPublicPageCache({
      repository: createPublicPageCacheRepository(redis),
      config: baseConfig,
      resolve: async (username) => ({
        id: username === 'slow' ? slowId : fastId,
        revision: 1,
        isPublished: true,
      }),
      load: async (pageId) => {
        if (pageId === slowId) await gate.promise

        return buildPublicPage(pageId, 'x', 'ok')
      },
    })

    const blocked = cache.get('slow')

    await wait(50)

    const startedAt = Date.now()

    expect((await cache.get('fast'))?.bio).toBe('ok')

    expect(Date.now() - startedAt).toBeLessThan(500)

    gate.resolve()

    expect((await blocked)?.bio).toBe('ok')
  })

  it('caches a missing page and clears it when the page is created', async () => {
    const cache = await instance()

    database.exists = false

    expect(await cache.get('maria')).toBeUndefined()

    expect(await cache.get('maria')).toBeUndefined()

    expect(database.resolveCalls).toBe(1)

    database.exists = true

    database.revision = 5

    await cache.invalidate([{ username: 'maria', pageId: database.pageId, revision: 5 }])

    expect((await cache.get('maria'))?.bio).toBe('v1')
  })

  describe('repository guards', () => {
    it('refuses to publish when the lock was lost', async () => {
      const redis = await connect()

      opened.push(redis)

      const repository = createPublicPageCacheRepository(redis)

      const input = {
        username: 'maria',
        pageId: database.pageId,
        revision: 1,
        content: '{}',
        refTtlMs: 60_000,
        contentTtlMs: 60_000,
      }

      expect(await repository.tryLock('maria', 'owner', 100)).toBe(true)

      await wait(150)

      expect(await repository.tryLock('maria', 'other', 5_000)).toBe(true)

      expect(await repository.publish({ ...input, token: 'owner' })).toBe(-1)

      expect(await redis.get(cacheKeys.ref('maria'))).toBeNull()
    })

    it('does not release a lock that belongs to someone else', async () => {
      const redis = await connect()

      opened.push(redis)

      const repository = createPublicPageCacheRepository(redis)

      await repository.tryLock('maria', 'owner', 5_000)

      await repository.release('maria', 'intruder')

      expect(await repository.tryLock('maria', 'third', 5_000)).toBe(false)

      await repository.release('maria', 'owner')

      expect(await repository.tryLock('maria', 'third', 5_000)).toBe(true)
    })

    it('only moves the ref forward and lets a tombstone win a tie', async () => {
      const redis = await connect()

      opened.push(redis)

      const repository = createPublicPageCacheRepository(redis)

      expect(await repository.setRef('maria', 'a:5', 5, 60_000)).toBe(true)

      expect(await repository.setRef('maria', 'a:4', 4, 60_000)).toBe(false)

      expect(await repository.setRef('maria', 'a:5', 5, 60_000)).toBe(true)

      expect(await repository.setRef('maria', '-:5', 5, 60_000)).toBe(true)

      expect(await repository.setRef('maria', 'a:5', 5, 60_000)).toBe(false)

      expect(await repository.setRef('maria', 'b:6', 6, 60_000)).toBe(true)

      expect(await redis.get(cacheKeys.ref('maria'))).toBe('b:6')
    })
  })
})
