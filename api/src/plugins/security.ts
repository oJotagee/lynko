import fastifyRateLimit from '@fastify/rate-limit'
import type { FastifyInstance } from 'fastify'
import fastifyHelmet from '@fastify/helmet'
import fastifyCors from '@fastify/cors'

import { env } from '../config/env'

export function registerSecurity(app: FastifyInstance) {
  app.register(fastifyHelmet)

  app.register(fastifyCors, {
    origin: env.CORS_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  })

  app.register(fastifyRateLimit, {
    max: 100,
    timeWindow: '1 minute',
  })
}

export const authRateLimit = {
  login: { max: 5, timeWindow: '1 minute' },
  register: { max: 5, timeWindow: '1 hour' },
  refresh: { max: 30, timeWindow: '1 minute' },
}
