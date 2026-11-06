import { afterEach, beforeEach, describe, expect, it, mock, spyOn } from 'bun:test'

import { env } from '../../../../src/config/env'
import { analyticsQueue } from '../../../../src/modules/analytics/analytics.queue'
import { cacheMetrics } from '../../../../src/modules/pages/pages.cache'
import { createTestApp } from '../../support/app'

const TOKEN = 'metrics-token-with-at-least-32-characters'

describe('health routes', () => {
  let app: Awaited<ReturnType<typeof createTestApp>>

  const original = env.METRICS_TOKEN

  beforeEach(async () => {
    app = await createTestApp()

    cacheMetrics.reset()
  })

  afterEach(async () => {
    env.METRICS_TOKEN = original

    await app.close()

    mock.restore()
  })

  it('GET /health stays public', async () => {
    const response = await app.inject({ method: 'GET', url: '/health' })

    expect(response.statusCode).toBe(200)

    expect(response.json()).toEqual({ status: 'ok' })
  })

  it('GET /health/metrics responds 404 when no token is configured', async () => {
    env.METRICS_TOKEN = undefined

    const response = await app.inject({
      method: 'GET',
      url: '/health/metrics',
      headers: { 'x-metrics-token': TOKEN },
    })

    expect(response.statusCode).toBe(404)
  })

  it.each([
    ['is missing', {}],
    ['is wrong', { 'x-metrics-token': 'x'.repeat(40) }],
    ['has another length', { 'x-metrics-token': 'short' }],
  ])('GET /health/metrics responds 401 when the token %s', async (_case, headers) => {
    env.METRICS_TOKEN = TOKEN

    const response = await app.inject({ method: 'GET', url: '/health/metrics', headers })

    expect(response.statusCode).toBe(401)
  })

  it('GET /health/metrics returns the cache metrics with the right token', async () => {
    env.METRICS_TOKEN = TOKEN

    cacheMetrics.increment('hit')

    cacheMetrics.observe('dbMs', 12)

    const response = await app.inject({
      method: 'GET',
      url: '/health/metrics',
      headers: { 'x-metrics-token': TOKEN },
    })

    expect(response.statusCode).toBe(200)

    expect(response.json().cache.counters.hit).toBe(1)

    expect(response.json().cache.timings.dbMs).toEqual({ count: 1, sum: 12, max: 12 })
  })

  it.skipIf(!analyticsQueue)('GET /health/metrics reports the queue backlog', async () => {
    env.METRICS_TOKEN = TOKEN

    const counts = { waiting: 3, active: 1, delayed: 0, failed: 2 }

    spyOn(analyticsQueue as NonNullable<typeof analyticsQueue>, 'getJobCounts').mockResolvedValue(
      counts,
    )

    const response = await app.inject({
      method: 'GET',
      url: '/health/metrics',
      headers: { 'x-metrics-token': TOKEN },
    })

    expect(response.json().queue).toEqual(counts)
  })

  it.skipIf(!analyticsQueue)(
    'GET /health/metrics reports a null backlog when the queue fails',
    async () => {
      env.METRICS_TOKEN = TOKEN

      spyOn(analyticsQueue as NonNullable<typeof analyticsQueue>, 'getJobCounts').mockRejectedValue(
        new Error('redis down'),
      )

      const response = await app.inject({
        method: 'GET',
        url: '/health/metrics',
        headers: { 'x-metrics-token': TOKEN },
      })

      expect(response.statusCode).toBe(200)

      expect(response.json().queue).toBeNull()
    },
  )
})
