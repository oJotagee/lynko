import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import type { FastifyReply } from 'fastify'
import { z } from 'zod'

import { accessTokenResponse, loginBody, registerBody } from './auth.dto'
import { userResponse } from '../users/users.dto'
import { authService } from './auth.service'
import { env } from '../../config/env'
import { authRateLimit } from '../../plugins/security'

const REFRESH_COOKIE = 'refreshToken'

const refreshCookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'strict',
  path: '/auth',
} as const

function setRefreshCookie(reply: FastifyReply, token: string, expires: Date) {
  reply.setCookie(REFRESH_COOKIE, token, { ...refreshCookieOptions, expires })
}

export const authRoutes: FastifyPluginAsyncZod = async (app) => {
  app.post(
    '/register',
    {
      config: { rateLimit: authRateLimit.register },
      schema: {
        tags: ['Auth'],
        summary: 'Create a new user',
        body: registerBody,
        response: { 201: userResponse },
      },
    },
    async (request, reply) => {
      const user = await authService.register(request.body)

      return reply.status(201).send(user)
    },
  )

  app.post(
    '/login',
    {
      config: { rateLimit: authRateLimit.login },
      schema: {
        tags: ['Auth'],
        summary: 'Authenticate with email and password',
        description: 'Returns the access token and sets the refresh token in an httpOnly cookie.',
        body: loginBody,
        response: { 200: accessTokenResponse },
      },
    },
    async (request, reply) => {
      const session = await authService.login(request.body)

      setRefreshCookie(reply, session.refreshToken, session.refreshTokenExpiresAt)

      const accessToken = app.jwt.sign({ sub: session.userId, sid: session.sessionId })

      return { accessToken }
    },
  )

  app.post(
    '/refresh',
    {
      config: { rateLimit: authRateLimit.refresh },
      schema: {
        tags: ['Auth'],
        summary: 'Get a new access token',
        description: 'Uses the refresh token cookie. The cookie is rotated on every call.',
        response: { 200: accessTokenResponse },
      },
    },
    async (request, reply) => {
      try {
        const session = await authService.refresh(request.cookies[REFRESH_COOKIE])

        setRefreshCookie(reply, session.refreshToken, session.refreshTokenExpiresAt)

        const accessToken = app.jwt.sign({ sub: session.userId, sid: session.sessionId })

        return { accessToken }
      } catch (error) {
        reply.clearCookie(REFRESH_COOKIE, refreshCookieOptions)

        throw error
      }
    },
  )

  app.post(
    '/logout',
    {
      schema: {
        tags: ['Auth'],
        summary: 'End the current session',
        description: 'Revokes the session from the refresh token cookie and clears it.',
        response: { 204: z.null() },
      },
    },
    async (request, reply) => {
      await authService.logout(request.cookies[REFRESH_COOKIE])

      reply.clearCookie(REFRESH_COOKIE, refreshCookieOptions)

      return reply.status(204).send(null)
    },
  )
}
