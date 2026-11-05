import { Redis } from 'ioredis'

import { env } from '../config/env'

export function createRedis(url: string) {
  const redis = new Redis(url, {
    commandTimeout: 300,
    enableOfflineQueue: false,
    maxRetriesPerRequest: 1,
  })

  redis.on('error', (error) => {
    console.error('Redis connection error', error.message)
  })

  return redis
}

export const cacheRedis = env.REDIS_URL ? createRedis(env.REDIS_URL) : null
