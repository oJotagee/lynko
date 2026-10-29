import type { FastifyRequest } from 'fastify'
import fastifyCookie from '@fastify/cookie'
import fastifyJwt from '@fastify/jwt'
import fp from 'fastify-plugin'

import { authService } from '../modules/auth/auth.service'
import { UnauthorizedError } from '../shared/errors'
import { env } from '../config/env'

export const authPlugin = fp(
  async (app) => {
    await app.register(fastifyCookie)

    await app.register(fastifyJwt, {
      secret: env.JWT_SECRET,
      sign: { expiresIn: env.JWT_EXPIRES_IN },
    })

    app.decorate('authenticate', async (request: FastifyRequest) => {
      try {
        await request.jwtVerify()
      } catch {
        throw new UnauthorizedError('Invalid or missing token')
      }

      // Token válido, mas a sessão pode ter sido encerrada (logout) ou expirada
      const { sub, sid } = request.user

      if (!sid || !(await authService.isSessionValid(sid, sub))) {
        throw new UnauthorizedError('Session expired or revoked')
      }
    })
  },
  { name: 'auth' },
)
