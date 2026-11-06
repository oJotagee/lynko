import { randomUUID } from 'node:crypto'
import type { z } from 'zod'

import { ServiceUnavailableError } from '../../shared/errors'
import type { CacheEntry, PublicPageCacheRepository } from './pages.cache.repository'
import { publicPageResponse } from './pages.dto'

export type PublicPage = z.infer<typeof publicPageResponse>

export interface PageRef {
  id: string
  revision: number
  isPublished: boolean
}

export interface InvalidateEntry {
  username: string
  revision: number
  pageId?: string
}

export interface PublicPageCacheConfig {
  contentTtlMs: number
  refTtlMs: number
  notFoundTtlMs: number
  refreshThresholdMs: number
  lockTtlMs: number
  waitTimeoutMs: number
  fallbackLimit: number
}

export interface CacheLogger {
  debug(fields: Record<string, unknown>, message: string): void
  info(fields: Record<string, unknown>, message: string): void
  warn(fields: Record<string, unknown>, message: string): void
  error(fields: Record<string, unknown>, message: string): void
}

export const NOT_FOUND_TTL_MS = 60_000

export const FALLBACK_LIMIT = 20

const BACKOFF_STEPS_MS = [25, 50, 100, 200]

const BUILD_ROUNDS = 2

const noopLogger: CacheLogger = {
  debug: () => undefined,
  info: () => undefined,
  warn: () => undefined,
  error: () => undefined,
}

let activeLogger: CacheLogger = noopLogger

export function setPublicPageCacheLogger(logger: CacheLogger) {
  activeLogger = logger
}

export const sharedCacheLogger: CacheLogger = {
  debug: (fields, message) => activeLogger.debug(fields, message),
  info: (fields, message) => activeLogger.info(fields, message),
  warn: (fields, message) => activeLogger.warn(fields, message),
  error: (fields, message) => activeLogger.error(fields, message),
}

export function toInvalidateEntry(page: {
  id: string
  username: string
  revision: number
  isPublished: boolean
}): InvalidateEntry {
  return {
    username: page.username,
    revision: page.revision,
    ...(page.isPublished && { pageId: page.id }),
  }
}

type CounterName =
  | 'hit'
  | 'miss'
  | 'refresh'
  | 'invalidation'
  | 'invalidationFailed'
  | 'lockAcquired'
  | 'lockContention'
  | 'lockTimeout'
  | 'fallback'

type TimingName = 'dbMs' | 'waitMs'

interface Timing {
  count: number
  sum: number
  max: number
}

function emptyCounters(): Record<CounterName, number> {
  return {
    hit: 0,
    miss: 0,
    refresh: 0,
    invalidation: 0,
    invalidationFailed: 0,
    lockAcquired: 0,
    lockContention: 0,
    lockTimeout: 0,
    fallback: 0,
  }
}

function emptyTimings(): Record<TimingName, Timing> {
  return {
    dbMs: { count: 0, sum: 0, max: 0 },
    waitMs: { count: 0, sum: 0, max: 0 },
  }
}

export function createCacheMetrics() {
  let counters = emptyCounters()

  let timings = emptyTimings()

  return {
    increment(name: CounterName) {
      counters[name] += 1
    },

    observe(name: TimingName, ms: number) {
      const timing = timings[name]

      timing.count += 1

      timing.sum += ms

      timing.max = Math.max(timing.max, ms)
    },

    snapshot() {
      return {
        counters: { ...counters },
        timings: {
          dbMs: { ...timings.dbMs },
          waitMs: { ...timings.waitMs },
        },
      }
    },

    reset() {
      counters = emptyCounters()

      timings = emptyTimings()
    },
  }
}

export type CacheMetrics = ReturnType<typeof createCacheMetrics>

export const cacheMetrics = createCacheMetrics()

export interface PublicPageCacheDeps {
  repository: PublicPageCacheRepository | null
  config: PublicPageCacheConfig
  resolve: (username: string) => Promise<PageRef | undefined>
  load: (pageId: string) => Promise<PublicPage | undefined>
  metrics?: CacheMetrics
  log?: CacheLogger
  sleep?: (ms: number) => Promise<void>
  random?: () => number
  now?: () => number
}

class RedisUnavailableError extends Error {}

type Classification =
  | { kind: 'notFound' }
  | { kind: 'fresh'; page: PublicPage }
  | { kind: 'miss' }
  | { kind: 'refresh' }

type FallbackReason = 'disabled' | 'redis_error' | 'wait_timeout'

function parseRef(ref: string) {
  const match = /^([^:]+):(\d+)$/.exec(ref)

  if (!match) return undefined

  return { pageId: match[1] === '-' ? null : (match[1] ?? null), revision: Number(match[2]) }
}

function parsePage(content: string): PublicPage | undefined {
  try {
    const result = publicPageResponse.safeParse(JSON.parse(content))

    return result.success ? result.data : undefined
  } catch {
    return undefined
  }
}

export function createPublicPageCache(deps: PublicPageCacheDeps) {
  const { repository, config, resolve, load } = deps

  const metrics = deps.metrics ?? createCacheMetrics()

  const log = deps.log ?? noopLogger

  const sleep = deps.sleep ?? ((ms: number) => new Promise<void>((done) => setTimeout(done, ms)))

  const random = deps.random ?? Math.random

  const now = deps.now ?? Date.now

  const inflight = new Map<string, Promise<PublicPage | undefined>>()

  let fallbackActive = 0

  async function redisCall<T>(operation: () => Promise<T>) {
    try {
      return await operation()
    } catch (error) {
      throw new RedisUnavailableError('Redis unavailable', { cause: error })
    }
  }

  async function settle<T>(operation: () => Promise<T>) {
    try {
      return await operation()
    } catch (error) {
      log.warn({ event: 'cache.redis_error', error: String(error) }, 'Redis call failed')

      return undefined
    }
  }

  function classify(entry: CacheEntry): Classification {
    if (!entry.ref) return { kind: 'miss' }

    const ref = parseRef(entry.ref)

    if (!ref) return { kind: 'miss' }

    if (ref.pageId === null) return { kind: 'notFound' }

    if (!entry.content) return { kind: 'miss' }

    const page = parsePage(entry.content)

    if (!page) return { kind: 'miss' }

    if (entry.pttl >= 0 && entry.pttl <= config.refreshThresholdMs) return { kind: 'refresh' }

    return { kind: 'fresh', page }
  }

  function backoff(attempt: number) {
    const step = BACKOFF_STEPS_MS[Math.min(attempt, BACKOFF_STEPS_MS.length - 1)] ?? 200

    return step + random() * step * 0.5
  }

  async function fallback(username: string, reason: FallbackReason) {
    metrics.increment('fallback')

    log[reason === 'disabled' ? 'debug' : 'warn'](
      { event: 'cache.fallback', username, reason },
      'Reading page from the database',
    )

    if (fallbackActive >= config.fallbackLimit) {
      throw new ServiceUnavailableError('Public page temporarily unavailable')
    }

    fallbackActive += 1

    try {
      const ref = await resolve(username)

      if (!ref?.isPublished) return undefined

      return await load(ref.id)
    } finally {
      fallbackActive -= 1
    }
  }

  async function reuse(repo: PublicPageCacheRepository, ref: PageRef) {
    const existing = await settle(() => repo.readContent(ref.id, ref.revision))

    if (!existing?.content || existing.pttl <= config.refreshThresholdMs) return undefined

    return parsePage(existing.content)
  }

  async function build(repo: PublicPageCacheRepository, username: string, token: string) {
    let page: PublicPage | undefined

    for (let round = 0; round < BUILD_ROUNDS; round += 1) {
      const ref = await resolve(username)

      if (!ref?.isPublished) {
        const revision = ref?.revision ?? 0

        await settle(() => repo.setRef(username, `-:${revision}`, revision, config.notFoundTtlMs))

        return undefined
      }

      const reusable = await reuse(repo, ref)

      if (reusable) {
        await settle(() =>
          repo.setRef(username, `${ref.id}:${ref.revision}`, ref.revision, config.refTtlMs),
        )

        return reusable
      }

      const startedAt = now()

      page = await load(ref.id)

      metrics.observe('dbMs', now() - startedAt)

      if (!page) continue

      const content = JSON.stringify(publicPageResponse.parse(page))

      const outcome = await settle(() =>
        repo.publish({
          username,
          pageId: ref.id,
          revision: ref.revision,
          token,
          content,
          refTtlMs: config.refTtlMs,
          contentTtlMs: config.contentTtlMs,
        }),
      )

      if (outcome !== 0) return page

      log.debug({ event: 'cache.stale_publish', username }, 'Revision changed, rebuilding')
    }

    return page
  }

  async function rebuild(
    repo: PublicPageCacheRepository,
    username: string,
    token: string,
    kind: 'miss' | 'refresh',
  ) {
    metrics.increment('lockAcquired')

    metrics.increment(kind)

    log.debug({ event: 'cache.lock_acquired', username }, 'Rebuild lock acquired')

    const startedAt = now()

    try {
      const page = await build(repo, username, token)

      log.info(
        { event: `cache.${kind}`, username, rebuildMs: now() - startedAt },
        'Public page rebuilt',
      )

      return page
    } finally {
      await settle(() => repo.release(username, token))
    }
  }

  async function fromCache(repo: PublicPageCacheRepository, username: string) {
    const startedAt = now()

    let attempt = 0

    let contended = false

    while (true) {
      const state = classify(await redisCall(() => repo.read(username)))

      if (state.kind === 'notFound') {
        metrics.increment('hit')

        return undefined
      }

      if (state.kind === 'fresh') {
        metrics.increment('hit')

        log.debug({ event: 'cache.hit', username }, 'Public page served from cache')

        if (contended) metrics.observe('waitMs', now() - startedAt)

        return state.page
      }

      const token = randomUUID()

      if (await redisCall(() => repo.tryLock(username, token, config.lockTtlMs))) {
        if (contended) metrics.observe('waitMs', now() - startedAt)

        return await rebuild(repo, username, token, state.kind)
      }

      if (!contended) {
        contended = true

        metrics.increment('lockContention')

        log.debug({ event: 'cache.lock_contention', username }, 'Waiting for another rebuild')
      }

      const waited = now() - startedAt

      if (waited >= config.waitTimeoutMs) {
        metrics.increment('lockTimeout')

        metrics.observe('waitMs', waited)

        log.warn({ event: 'cache.lock_timeout', username, waitMs: waited }, 'Wait timed out')

        return await fallback(username, 'wait_timeout')
      }

      await sleep(backoff(attempt))

      attempt += 1
    }
  }

  async function run(username: string) {
    if (!repository) return await fallback(username, 'disabled')

    try {
      return await fromCache(repository, username)
    } catch (error) {
      if (!(error instanceof RedisUnavailableError)) throw error

      return await fallback(username, 'redis_error')
    }
  }

  return {
    get(username: string) {
      const running = inflight.get(username)

      if (running) return running

      const promise = run(username).finally(() => {
        if (inflight.get(username) === promise) inflight.delete(username)
      })

      inflight.set(username, promise)

      return promise
    },

    async invalidate(entries: InvalidateEntry[]) {
      for (const entry of entries) inflight.delete(entry.username)

      const repo = repository

      if (!repo) return

      await Promise.all(
        entries.map(async (entry) => {
          const value = entry.pageId ? `${entry.pageId}:${entry.revision}` : `-:${entry.revision}`

          const ttl = entry.pageId ? config.refTtlMs : config.notFoundTtlMs

          try {
            await repo.setRef(entry.username, value, entry.revision, ttl)

            metrics.increment('invalidation')

            log.info(
              { event: 'cache.invalidation', username: entry.username, revision: entry.revision },
              'Cache invalidated',
            )
          } catch (error) {
            metrics.increment('invalidationFailed')

            log.error(
              {
                event: 'cache.invalidation_failed',
                username: entry.username,
                error: String(error),
              },
              'Cache invalidation failed',
            )
          }
        }),
      )
    },

    metrics,
  }
}

export type PublicPageCache = ReturnType<typeof createPublicPageCache>
