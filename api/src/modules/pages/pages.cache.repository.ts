import type { Redis } from 'ioredis'

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

const ACCEPTS = `
local function accepts(current, value, revision)
  if not current then return true end

  local currentRevision = tonumber(string.match(current, ':(%d+)$'))

  if not currentRevision then return true end

  local nextRevision = tonumber(revision)

  if nextRevision > currentRevision then return true end

  if nextRevision < currentRevision then return false end

  if current == value then return true end

  return string.sub(value, 1, 2) == '-:'
end
`

const READ = `
local ref = redis.call('GET', KEYS[1])

if not ref then return {false, false, -2} end

local pageId, revision = string.match(ref, '^([^:]+):(%d+)$')

if not pageId or pageId == '-' then return {ref, false, -2} end

local key = ARGV[1] .. pageId .. ':v' .. revision

local content = redis.call('GET', key)

if not content then return {ref, false, -2} end

return {ref, content, redis.call('PTTL', key)}
`

const READ_CONTENT = `
local content = redis.call('GET', KEYS[1])

if not content then return {false, -2} end

return {content, redis.call('PTTL', KEYS[1])}
`

const SET_REF = `${ACCEPTS}
if not accepts(redis.call('GET', KEYS[1]), ARGV[1], ARGV[2]) then return 0 end

redis.call('SET', KEYS[1], ARGV[1], 'PX', ARGV[3])

return 1
`

const PUBLISH = `${ACCEPTS}
if redis.call('GET', KEYS[1]) ~= ARGV[1] then return -1 end

if not accepts(redis.call('GET', KEYS[2]), ARGV[2], ARGV[3]) then return 0 end

redis.call('SET', KEYS[3], ARGV[5], 'PX', ARGV[6])

redis.call('SET', KEYS[2], ARGV[2], 'PX', ARGV[4])

return 1
`

const RELEASE = `
if redis.call('GET', KEYS[1]) == ARGV[1] then
  return redis.call('DEL', KEYS[1])
end

return 0
`

interface ScriptedRedis extends Redis {
  pageCacheRead(
    refKey: string,
    contentPrefix: string,
  ): Promise<[string | null, string | null, number]>
  pageCacheReadContent(contentKey: string): Promise<[string | null, number]>
  pageCacheSetRef(refKey: string, value: string, revision: number, ttlMs: number): Promise<0 | 1>
  pageCachePublish(
    lockKey: string,
    refKey: string,
    contentKey: string,
    token: string,
    refValue: string,
    revision: number,
    refTtlMs: number,
    content: string,
    contentTtlMs: number,
  ): Promise<PublishOutcome>
  pageCacheRelease(lockKey: string, token: string): Promise<0 | 1>
}

export function createPublicPageCacheRepository(redis: Redis): PublicPageCacheRepository {
  redis.defineCommand('pageCacheRead', { numberOfKeys: 1, lua: READ })

  redis.defineCommand('pageCacheReadContent', { numberOfKeys: 1, lua: READ_CONTENT })

  redis.defineCommand('pageCacheSetRef', { numberOfKeys: 1, lua: SET_REF })

  redis.defineCommand('pageCachePublish', { numberOfKeys: 3, lua: PUBLISH })

  redis.defineCommand('pageCacheRelease', { numberOfKeys: 1, lua: RELEASE })

  const client = redis as ScriptedRedis

  return {
    async read(username) {
      const [ref, content, pttl] = await client.pageCacheRead(
        cacheKeys.ref(username),
        CONTENT_PREFIX,
      )

      return { ref, content, pttl }
    },

    async readContent(pageId, revision) {
      const [content, pttl] = await client.pageCacheReadContent(cacheKeys.content(pageId, revision))

      return { content, pttl }
    },

    async tryLock(username, token, ttlMs) {
      return (await client.set(cacheKeys.lock(username), token, 'PX', ttlMs, 'NX')) === 'OK'
    },

    async setRef(username, value, revision, ttlMs) {
      return (await client.pageCacheSetRef(cacheKeys.ref(username), value, revision, ttlMs)) === 1
    },

    async publish(input) {
      return client.pageCachePublish(
        cacheKeys.lock(input.username),
        cacheKeys.ref(input.username),
        cacheKeys.content(input.pageId, input.revision),
        input.token,
        `${input.pageId}:${input.revision}`,
        input.revision,
        input.refTtlMs,
        input.content,
        input.contentTtlMs,
      )
    },

    async release(username, token) {
      await client.pageCacheRelease(cacheKeys.lock(username), token)
    },
  }
}
