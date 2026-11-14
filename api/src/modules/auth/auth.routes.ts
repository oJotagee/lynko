import type { FastifyReply, FastifyRequest } from 'fastify'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { env } from '../../config/env'
import { authRateLimit } from '../../plugins/security'
import { userResponse } from '../users/users.dto'
import { usersService } from '../users/users.service'
import {
  accessTokenResponse,
  confirmDeletionBody,
  forgotPasswordBody,
  googleLoginBody,
  loginBody,
  loginResponse,
  registerBody,
  resendVerificationResponse,
  resetPasswordBody,
  twoFactorLoginBody,
  verifyEmailBody,
} from './auth.dto'
import { authService } from './auth.service'
import { normalizeUserAgent } from './auth.user-agent'

const REFRESH_COOKIE = 'refreshToken'

const refreshCookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'strict',
  path: '/auth',
} as const

function readUserAgent(request: FastifyRequest) {
  return normalizeUserAgent(request.headers['x-client-user-agent'])
}

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
        description:
          'Returns the access token and sets the refresh token in an httpOnly cookie. With two-factor authentication enabled, returns a challenge for /auth/login/two-factor instead. The web sends the browser user agent in x-client-user-agent.',
        body: loginBody,
        response: { 200: loginResponse },
      },
    },
    async (request, reply) => {
      const result = await authService.login(request.body, readUserAgent(request))

      if ('challengeToken' in result) {
        return { twoFactorRequired: true as const, challengeToken: result.challengeToken }
      }

      setRefreshCookie(reply, result.refreshToken, result.refreshTokenExpiresAt)

      const accessToken = app.jwt.sign({ sub: result.userId, sid: result.sessionId })

      return { accessToken }
    },
  )

  app.post(
    '/login/two-factor',
    {
      config: { rateLimit: authRateLimit.twoFactor },
      schema: {
        tags: ['Auth'],
        summary: 'Finish the login with a two-factor code',
        description:
          'Takes the challenge from /auth/login and a code from the app or a recovery code. Five wrong codes lock the step for 15 minutes.',
        body: twoFactorLoginBody,
        response: { 200: accessTokenResponse },
      },
    },
    async (request, reply) => {
      const session = await authService.loginWithTwoFactor(request.body, readUserAgent(request))

      setRefreshCookie(reply, session.refreshToken, session.refreshTokenExpiresAt)

      const accessToken = app.jwt.sign({ sub: session.userId, sid: session.sessionId })

      return { accessToken }
    },
  )

  app.post(
    '/google',
    {
      config: { rateLimit: authRateLimit.google },
      schema: {
        tags: ['Auth'],
        summary: 'Authenticate with a Google ID token',
        description:
          'Creates the account, or links it by e-mail when Google verified it. Returns the access token and sets the refresh token in an httpOnly cookie.',
        body: googleLoginBody,
        response: { 200: accessTokenResponse },
      },
    },
    async (request, reply) => {
      const session = await authService.loginWithGoogle(request.body, readUserAgent(request))

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
    '/verify-email',
    {
      config: { rateLimit: authRateLimit.verifyEmail },
      schema: {
        tags: ['Auth'],
        summary: 'Verify the e-mail with the link token',
        body: verifyEmailBody,
        response: { 204: z.null() },
      },
    },
    async (request, reply) => {
      await authService.verifyEmail(request.body.token)

      return reply.status(204).send(null)
    },
  )

  app.post(
    '/verify-email/resend',
    {
      onRequest: [app.authenticate],
      config: { rateLimit: authRateLimit.resend },
      schema: {
        tags: ['Auth'],
        summary: 'Resend the e-mail verification link',
        description: 'Allowed once every 60 seconds. The response tells how long to wait.',
        security: [{ bearerAuth: [] }],
        response: { 202: resendVerificationResponse },
      },
    },
    async (request, reply) => {
      const result = await authService.resendVerification(request.user.sub)

      return reply.status(202).send(result)
    },
  )

  app.post(
    '/forgot-password',
    {
      config: { rateLimit: authRateLimit.forgotPassword },
      schema: {
        tags: ['Auth'],
        summary: 'Request a password reset link',
        description: 'Always answers 204, whether or not the account exists.',
        body: forgotPasswordBody,
        response: { 204: z.null() },
      },
    },
    async (request, reply) => {
      await authService.forgotPassword(request.body)

      return reply.status(204).send(null)
    },
  )

  app.post(
    '/reset-password',
    {
      config: { rateLimit: authRateLimit.resetPassword },
      schema: {
        tags: ['Auth'],
        summary: 'Set a new password with the link token',
        description: 'Revokes every session of the account.',
        body: resetPasswordBody,
        response: { 204: z.null() },
      },
    },
    async (request, reply) => {
      await authService.resetPassword(request.body)

      return reply.status(204).send(null)
    },
  )

  app.post(
    '/confirm-deletion',
    {
      config: { rateLimit: authRateLimit.confirmDeletion },
      schema: {
        tags: ['Auth'],
        summary: 'Confirm the account deletion with the link token',
        description: 'Deletes the account and all its data. This cannot be undone.',
        body: confirmDeletionBody,
        response: { 204: z.null() },
      },
    },
    async (request, reply) => {
      await usersService.confirmDeletion(request.body.token)

      return reply.status(204).send(null)
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
