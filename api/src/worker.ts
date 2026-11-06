import { Worker } from 'bullmq'
import { Redis } from 'ioredis'
import { env } from './config/env'
import { CLEANUP_JOB, processAnalyticsJob } from './modules/analytics/analytics.processor'
import { ANALYTICS_QUEUE, analyticsQueue } from './modules/analytics/analytics.queue'

function log(level: 'info' | 'error', message: string, fields: Record<string, unknown> = {}) {
  console[level](JSON.stringify({ level, time: new Date().toISOString(), message, ...fields }))
}

if (!env.QUEUE_REDIS_URL || !analyticsQueue) {
  log('error', 'QUEUE_REDIS_URL is required to run the analytics worker')

  process.exit(1)
}

const worker = new Worker(ANALYTICS_QUEUE, processAnalyticsJob, {
  connection: new Redis(env.QUEUE_REDIS_URL, { maxRetriesPerRequest: null }),
  concurrency: 10,
})

worker.on('completed', (job) => {
  log('info', 'job completed', { jobId: job.id, type: job.name, attemptsMade: job.attemptsMade })
})

worker.on('failed', (job, error) => {
  log('error', 'job failed', {
    jobId: job?.id,
    type: job?.name,
    attemptsMade: job?.attemptsMade,
    error: error.message,
  })
})

worker.on('error', (error) => {
  log('error', 'worker error', { error: error.message })
})

await analyticsQueue.upsertJobScheduler(
  'analytics-cleanup',
  { pattern: '0 3 * * *' },
  { name: CLEANUP_JOB },
)

log('info', 'analytics worker started')

async function shutdown() {
  await worker.close()

  await analyticsQueue?.close()

  process.exit(0)
}

process.on('SIGTERM', shutdown)

process.on('SIGINT', shutdown)
