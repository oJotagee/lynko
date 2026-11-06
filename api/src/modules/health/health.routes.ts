import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { requireMetricsToken } from '../../plugins/metrics-guard'
import { analyticsQueue } from '../analytics/analytics.queue'
import { cacheMetrics } from '../pages/pages.cache'

const timingSchema = z.object({ count: z.number(), sum: z.number(), max: z.number() })

const metricsResponse = z.object({
  cache: z.object({
    counters: z.record(z.string(), z.number()),
    timings: z.object({ dbMs: timingSchema, waitMs: timingSchema }),
  }),
  queue: z.record(z.string(), z.number()).nullable(),
})

async function readBacklog() {
  try {
    return (await analyticsQueue?.getJobCounts('waiting', 'active', 'delayed', 'failed')) ?? null
  } catch {
    return null
  }
}

export const healthRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '',
    {
      schema: {
        tags: ['Health'],
        summary: 'Health check endpoint',
        response: {
          200: z.object({
            status: z.literal('ok'),
          }),
        },
      },
    },
    async () => {
      return { status: 'ok' as const }
    },
  )

  app.get(
    '/metrics',
    {
      onRequest: [requireMetricsToken],
      schema: {
        tags: ['Health'],
        summary: 'Get the public page cache metrics',
        description:
          'Operations only. Send the x-metrics-token header. Responds 404 when METRICS_TOKEN is not set.',
        headers: z.object({ 'x-metrics-token': z.string().optional() }),
        response: { 200: metricsResponse },
      },
    },
    async () => {
      return { cache: cacheMetrics.snapshot(), queue: await readBacklog() }
    },
  )
}
