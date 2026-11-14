import fastifyCors from '@fastify/cors'
import fastifyHelmet from '@fastify/helmet'
import fastifyRateLimit from '@fastify/rate-limit'
import type { FastifyInstance } from 'fastify'

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
    hook: 'preHandler',
    keyGenerator: (request) => (request.user?.sub ? `user:${request.user.sub}` : request.ip),
  })
}

export const authRateLimit = {
  login: { max: 5, timeWindow: '1 minute' },
  register: { max: 5, timeWindow: '1 hour' },
  refresh: { max: 30, timeWindow: '1 minute' },
  verifyEmail: { max: 10, timeWindow: '1 hour' },
  resend: { max: 5, timeWindow: '1 hour' },
  forgotPassword: { max: 5, timeWindow: '1 hour' },
  resetPassword: { max: 10, timeWindow: '1 hour' },
  confirmDeletion: { max: 10, timeWindow: '1 hour' },
  google: { max: 10, timeWindow: '1 minute' },
  twoFactor: { max: 10, timeWindow: '1 minute' },
}

export const accountRateLimit = {
  changePassword: { max: 5, timeWindow: '15 minutes' },
  deletion: { max: 5, timeWindow: '1 hour' },
  sessions: { max: 30, timeWindow: '1 minute' },
  twoFactor: { max: 10, timeWindow: '15 minutes' },
}

export const analyticsRateLimit = {
  views: { max: 30, timeWindow: '1 minute' },
}

export const mediaRateLimit = {
  presign: { max: 10, timeWindow: '1 minute' },
  confirm: { max: 20, timeWindow: '1 minute' },
}
