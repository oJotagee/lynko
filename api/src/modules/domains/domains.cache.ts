import { z } from 'zod'
import { cacheRedis } from '../../db/redis'

const FOUND_TTL_SECONDS = 5 * 60

const NOT_FOUND_TTL_SECONDS = 60

const cachedOwner = z.object({ userId: z.uuid(), username: z.string() }).nullable()

export type DomainOwner = NonNullable<z.infer<typeof cachedOwner>>

function keyOf(hostname: string) {
  return `lynko:domain:${hostname}`
}

export const resolveCache = {
  async read(hostname: string) {
    if (!cacheRedis) return undefined

    try {
      const raw = await cacheRedis.get(keyOf(hostname))

      if (raw === null) return undefined

      const parsed = cachedOwner.safeParse(JSON.parse(raw))

      return parsed.success ? parsed.data : undefined
    } catch {
      return undefined
    }
  },

  async write(hostname: string, owner: DomainOwner | null) {
    if (!cacheRedis) return

    const ttl = owner ? FOUND_TTL_SECONDS : NOT_FOUND_TTL_SECONDS

    await cacheRedis
      .set(keyOf(hostname), JSON.stringify(owner), 'EX', ttl)
      .catch(() => console.error('Failed to cache domain owner', hostname))
  },

  async invalidate(hostname: string) {
    if (!cacheRedis) return

    await cacheRedis
      .del(keyOf(hostname))
      .catch(() => console.error('Failed to invalidate domain cache', hostname))
  },
}
