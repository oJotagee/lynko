import { UnrecoverableError } from 'bullmq'
import { analyticsEvent } from './analytics.dto'
import { analyticsRepository } from './analytics.repository'

export const CLEANUP_JOB = 'cleanup'

export const PROCESSED_RETENTION_MS = 30 * 24 * 60 * 60 * 1000

export async function processAnalyticsJob(job: { name: string; data: unknown }) {
  if (job.name === CLEANUP_JOB) {
    await analyticsRepository.deleteProcessedBefore(new Date(Date.now() - PROCESSED_RETENTION_MS))

    return
  }

  const parsed = analyticsEvent.safeParse(job.data)

  if (!parsed.success) throw new UnrecoverableError('Invalid analytics event')

  await analyticsRepository.recordEvent(parsed.data)
}
