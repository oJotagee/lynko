import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { accountRateLimit } from '../../plugins/security'
import { changePasswordBody, deleteAccountBody, userResponse } from './users.dto'
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
