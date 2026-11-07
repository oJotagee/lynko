import type { ChainableCommander, Redis } from 'ioredis'

export interface CacheEntry {
  ref: string | null
  content: string | null
  pttl: number
}

export interface PublishInput {
  username: string
  pageId: string
  revision: number
  token: string
  content: string
  refTtlMs: number
  contentTtlMs: number
}

export type PublishOutcome = -1 | 0 | 1

export interface PublicPageCacheRepository {
  read(username: string): Promise<CacheEntry>
  readContent(pageId: string, revision: number): Promise<{ content: string | null; pttl: number }>
  tryLock(username: string, token: string, ttlMs: number): Promise<boolean>
  setRef(username: string, value: string, revision: number, ttlMs: number): Promise<boolean>
  publish(input: PublishInput): Promise<PublishOutcome>
  release(username: string, token: string): Promise<void>
}

const CONTENT_PREFIX = 'lynko:page:public:'

export const cacheKeys = {
  ref: (username: string) => `lynko:page:ref:${username}`,
  content: (pageId: string, revision: number) => `${CONTENT_PREFIX}${pageId}:v${revision}`,
  lock: (username: string) => `lynko:page:refresh-lock:${username}`,
}

const tails = new Map<string, Promise<unknown>>()

function serialize<T>(key: string, operation: () => Promise<T>) {
  const run = (tails.get(key) ?? Promise.resolve()).then(operation)

  const tail = run.then(
    () => undefined,
    () => undefined,
  )

  tails.set(key, tail)

  tail.then(() => {
    if (tails.get(key) === tail) tails.delete(key)
  })

  return run
}

function accepts(current: string | null, value: string, revision: number) {
  if (!current) return true

  const match = /:(\d+)$/.exec(current)

  if (!match) return true

  const currentRevision = Number(match[1])

  if (revision > currentRevision) return true

  if (revision < currentRevision) return false

  return current === value || value.startsWith('-:')
}

async function execAll(pipeline: ChainableCommander) {
  const results = (await pipeline.exec()) ?? []

  for (const [error] of results) if (error) throw error

  return results.map(([, value]) => value)
}

async function readContentKey(redis: Redis, key: string) {
  const [content, pttl] = await execAll(redis.multi().get(key).pttl(key))

  return { content: (content as string | null) ?? null, pttl: Number(pttl ?? -2) }
}

export function createPublicPageCacheRepository(redis: Redis): PublicPageCacheRepository {
  return {
    async read(username) {
      const ref = await redis.get(cacheKeys.ref(username))

      if (!ref) return { ref: null, content: null, pttl: -2 }

      const match = /^([^:]+):(\d+)$/.exec(ref)

      if (!match || match[1] === '-') return { ref, content: null, pttl: -2 }

      const entry = await readContentKey(
        redis,
        cacheKeys.content(match[1] as string, Number(match[2])),
      )

      return { ref, ...entry }
    },

    readContent(pageId, revision) {
      return readContentKey(redis, cacheKeys.content(pageId, revision))
    },

    async tryLock(username, token, ttlMs) {
      return (await redis.set(cacheKeys.lock(username), token, 'PX', ttlMs, 'NX')) === 'OK'
    },

    setRef(username, value, revision, ttlMs) {
      return serialize(username, async () => {
        const key = cacheKeys.ref(username)

        if (!accepts(await redis.get(key), value, revision)) return false

        await redis.set(key, value, 'PX', ttlMs)

        return true
      })
    },

    publish(input) {
      return serialize(input.username, async (): Promise<PublishOutcome> => {
        if ((await redis.get(cacheKeys.lock(input.username))) !== input.token) return -1

        const refKey = cacheKeys.ref(input.username)

        const refValue = `${input.pageId}:${input.revision}`

        if (!accepts(await redis.get(refKey), refValue, input.revision)) return 0

        await execAll(
          redis
            .multi()
            .set(
              cacheKeys.content(input.pageId, input.revision),
              input.content,
              'PX',
              input.contentTtlMs,
            )
            .set(refKey, refValue, 'PX', input.refTtlMs),
        )

        return 1
      })
    },

    release(username, token) {
      return serialize(username, async () => {
        const key = cacheKeys.lock(username)

        if ((await redis.get(key)) === token) await redis.del(key)
      })
    },
  }
}
