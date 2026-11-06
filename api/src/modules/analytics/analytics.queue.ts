import { Queue } from 'bullmq'
import { env } from '../../config/env'
import { createRedis } from '../../db/redis'
import type { AnalyticsEvent } from './analytics.dto'

export const ANALYTICS_QUEUE = 'analytics'

export const analyticsQueue = env.QUEUE_REDIS_URL
  ? new Queue<AnalyticsEvent>(ANALYTICS_QUEUE, { connection: createRedis(env.QUEUE_REDIS_URL) })
  : null

analyticsQueue?.on('error', (error) => {
  console.error('Analytics queue error', error.message)
})

export const analyticsProducer = {
  async enqueue(event: AnalyticsEvent) {
    if (!analyticsQueue) {
      console.debug('Analytics queue disabled, event dropped', event.type)

      return
    }

    await analyticsQueue.add(event.type, event, {
      jobId: event.eventId,
      attempts: 5,
      backoff: { type: 'exponential', delay: 1000 },
      removeOnComplete: { age: 3600 },
      removeOnFail: { age: 604800 },
    })
  },

  async close() {
    await analyticsQueue?.close()
  },
}
