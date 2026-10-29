import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'

import { userResponse } from './users.dto'
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
}
