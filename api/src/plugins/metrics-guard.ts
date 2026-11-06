import { createHash, timingSafeEqual } from 'node:crypto'
import type { FastifyRequest } from 'fastify'

import { env } from '../config/env'
import { NotFoundError, UnauthorizedError } from '../shared/errors'

function digest(value: string) {
  return createHash('sha256').update(value).digest()
}

function tokenMatches(received: unknown, expected: string) {
  return typeof received === 'string' && timingSafeEqual(digest(received), digest(expected))
}

export async function requireMetricsToken(request: FastifyRequest) {
  if (!env.METRICS_TOKEN) throw new NotFoundError()

  if (!tokenMatches(request.headers['x-metrics-token'], env.METRICS_TOKEN)) {
    throw new UnauthorizedError('Invalid metrics token')
  }
}
