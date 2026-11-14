import { Queue } from 'bullmq'
import { env } from '../../config/env'
import { createRedis } from '../../db/redis'
import { domainsService } from './domains.service'

export const DOMAINS_QUEUE = 'domains'

export const CHECK_DOMAINS_JOB = 'check-domains'

export const CHECK_DOMAINS_EVERY_MS = 5 * 60 * 1000

export const domainsQueue = env.QUEUE_REDIS_URL
  ? new Queue(DOMAINS_QUEUE, { connection: createRedis(env.QUEUE_REDIS_URL) })
  : null

domainsQueue?.on('error', (error) => {
  console.error('Domains queue error', error.message)
})

export async function processDomainsJob(job: { name: string }) {
  if (job.name !== CHECK_DOMAINS_JOB) return

  await domainsService.checkDue()
}
