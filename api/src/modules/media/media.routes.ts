import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { mediaRateLimit } from '../../plugins/security'
import { mediaParams, mediaResponse, presignMediaBody, presignMediaResponse } from './media.dto'
import { mediaService } from './media.service'

export const mediaRoutes: FastifyPluginAsyncZod = async (app) => {
  app.addHook('onRequest', app.authenticate)

  app.post(
    '/presign',
    {
      config: { rateLimit: mediaRateLimit.presign },
      schema: {
        tags: ['Media'],
        summary: 'Create a presigned upload URL',
        description: 'Upload the file with PUT to uploadUrl, then call confirm.',
        security: [{ bearerAuth: [] }],
        body: presignMediaBody,
        response: { 201: presignMediaResponse },
      },
    },
    async (request, reply) => {
      const upload = await mediaService.presign(request.user.sub, request.body)

      return reply.status(201).send(upload)
    },
  )

  app.post(
    '/:id/confirm',
    {
      config: { rateLimit: mediaRateLimit.confirm },
      schema: {
        tags: ['Media'],
        summary: 'Validate an uploaded file and publish it',
        security: [{ bearerAuth: [] }],
        params: mediaParams,
        response: { 200: mediaResponse },
      },
    },
    async (request) => {
      return mediaService.confirm(request.user.sub, request.params.id)
    },
  )

  app.get(
    '/:id',
    {
      schema: {
        tags: ['Media'],
        summary: 'Get a media of the authenticated user page',
        security: [{ bearerAuth: [] }],
        params: mediaParams,
        response: { 200: mediaResponse },
      },
    },
    async (request) => {
      return mediaService.get(request.user.sub, request.params.id)
    },
  )

  app.delete(
    '/:id',
    {
      schema: {
        tags: ['Media'],
        summary: 'Delete a media',
        security: [{ bearerAuth: [] }],
        params: mediaParams,
        response: { 204: z.null() },
      },
    },
    async (request, reply) => {
      await mediaService.delete(request.user.sub, request.params.id)

      return reply.status(204).send(null)
    },
  )
}
