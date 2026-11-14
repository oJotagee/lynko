import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { accountRateLimit } from '../../plugins/security'
import { sessionsService } from '../auth/sessions.service'
import {
  recoveryCodesResponse,
  regenerateRecoveryCodesBody,
  twoFactorDisableBody,
  twoFactorEnableBody,
  twoFactorSetupBody,
  twoFactorSetupResponse,
  twoFactorStatusResponse,
} from '../two-factor/two-factor.dto'
import { twoFactorService } from '../two-factor/two-factor.service'
import {
  changePasswordBody,
  deleteAccountBody,
  revokedSessionsResponse,
  sessionParams,
  sessionResponse,
  userResponse,
} from './users.dto'
import { usersService } from './users.service'

export const usersRoutes: FastifyPluginAsyncZod = async (app) => {
  app.addHook('onRequest', app.authenticate)

  app.get(
    '/me',
    {
      schema: {
        tags: ['Users'],
        summary: 'Get the authenticated user',
        security: [{ bearerAuth: [] }],
        response: { 200: userResponse },
      },
    },
    async (request) => {
      return usersService.getProfile(request.user.sub)
    },
  )

  app.patch(
    '/me/password',
    {
      config: { rateLimit: accountRateLimit.changePassword },
      schema: {
        tags: ['Users'],
        summary: 'Change the password of the authenticated user',
        description: 'Ends every other session and keeps the current one.',
        security: [{ bearerAuth: [] }],
        body: changePasswordBody,
        response: { 204: z.null() },
      },
    },
    async (request, reply) => {
      await usersService.changePassword(request.user.sub, request.user.sid, request.body)

      return reply.status(204).send(null)
    },
  )

  app.get(
    '/me/sessions',
    {
      config: { rateLimit: accountRateLimit.sessions },
      schema: {
        tags: ['Users'],
        summary: 'List the active sessions of the authenticated user',
        description: 'The current session comes first, then the others by last activity.',
        security: [{ bearerAuth: [] }],
        response: { 200: z.array(sessionResponse) },
      },
    },
    async (request) => {
      return sessionsService.list(request.user.sub, request.user.sid)
    },
  )

  app.delete(
    '/me/sessions/:id',
    {
      config: { rateLimit: accountRateLimit.sessions },
      schema: {
        tags: ['Users'],
        summary: 'End another session of the authenticated user',
        description: 'The current session is ended with logout.',
        security: [{ bearerAuth: [] }],
        params: sessionParams,
        response: { 204: z.null() },
      },
    },
    async (request, reply) => {
      await sessionsService.revoke(request.user.sub, request.user.sid, request.params.id)

      return reply.status(204).send(null)
    },
  )

  app.delete(
    '/me/sessions',
    {
      config: { rateLimit: accountRateLimit.sessions },
      schema: {
        tags: ['Users'],
        summary: 'End every other session of the authenticated user',
        description: 'Keeps the current session.',
        security: [{ bearerAuth: [] }],
        response: { 200: revokedSessionsResponse },
      },
    },
    async (request) => {
      return sessionsService.revokeOthers(request.user.sub, request.user.sid)
    },
  )

  app.get(
    '/me/two-factor',
    {
      schema: {
        tags: ['Users'],
        summary: 'Get the two-factor authentication status',
        security: [{ bearerAuth: [] }],
        response: { 200: twoFactorStatusResponse },
      },
    },
    async (request) => {
      return twoFactorService.getStatus(request.user.sub)
    },
  )

  app.post(
    '/me/two-factor/setup',
    {
      config: { rateLimit: accountRateLimit.twoFactor },
      schema: {
        tags: ['Users'],
        summary: 'Start the two-factor setup',
        description:
          'Requires the password. Returns the secret and the otpauth URL for the authenticator app. Nothing is enabled until a valid code is confirmed.',
        security: [{ bearerAuth: [] }],
        body: twoFactorSetupBody,
        response: { 200: twoFactorSetupResponse },
      },
    },
    async (request) => {
      return twoFactorService.setup(request.user.sub, request.body.password)
    },
  )

  app.post(
    '/me/two-factor/enable',
    {
      config: { rateLimit: accountRateLimit.twoFactor },
      schema: {
        tags: ['Users'],
        summary: 'Enable two-factor authentication with a code from the app',
        description: 'Returns the recovery codes once and ends every other session of the account.',
        security: [{ bearerAuth: [] }],
        body: twoFactorEnableBody,
        response: { 200: recoveryCodesResponse },
      },
    },
    async (request) => {
      return twoFactorService.enable(request.user.sub, request.user.sid, request.body.code)
    },
  )

  app.post(
    '/me/two-factor/disable',
    {
      config: { rateLimit: accountRateLimit.twoFactor },
      schema: {
        tags: ['Users'],
        summary: 'Disable two-factor authentication',
        description: 'Requires the password and a code from the app or a recovery code.',
        security: [{ bearerAuth: [] }],
        body: twoFactorDisableBody,
        response: { 204: z.null() },
      },
    },
    async (request, reply) => {
      await twoFactorService.disable(request.user.sub, request.body)

      return reply.status(204).send(null)
    },
  )

  app.post(
    '/me/two-factor/recovery-codes',
    {
      config: { rateLimit: accountRateLimit.twoFactor },
      schema: {
        tags: ['Users'],
        summary: 'Replace the recovery codes',
        description: 'Requires the password and a code from the app. The old codes stop working.',
        security: [{ bearerAuth: [] }],
        body: regenerateRecoveryCodesBody,
        response: { 200: recoveryCodesResponse },
      },
    },
    async (request) => {
      return twoFactorService.regenerateRecoveryCodes(request.user.sub, request.body)
    },
  )

  app.post(
    '/me/deletion',
    {
      config: { rateLimit: accountRateLimit.deletion },
      schema: {
        tags: ['Users'],
        summary: 'Delete the authenticated account and all its data',
        description:
          'With a password, requires it and deletes right away (204). Without one, e-mails a confirmation link (202). This cannot be undone.',
        security: [{ bearerAuth: [] }],
        body: deleteAccountBody,
        response: { 204: z.null(), 202: z.object({ status: z.literal('email_sent') }) },
      },
    },
    async (request, reply) => {
      const result = await usersService.requestDeletion(request.user.sub, request.body.password)

      if (result.status === 'email_sent') return reply.status(202).send(result)

      return reply.status(204).send(null)
    },
  )
}
