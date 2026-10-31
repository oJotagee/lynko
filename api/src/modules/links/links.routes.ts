import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { linksService } from './links.service'
import {
  createLinkBody,
  linkParams,
  linkResponse,
  reorderLinksBody,
  updateLinkBody,
} from './links.dto'

export const linksRoutes: FastifyPluginAsyncZod = async (app) => {
  app.addHook('onRequest', app.authenticate)

  app.get(
    '',
    {
      schema: {
        tags: ['Links'],
        summary: 'List the links of the authenticated user page',
        security: [{ bearerAuth: [] }],
        response: { 200: z.array(linkResponse) },
      },
    },
    async (request) => {
      return linksService.list(request.user.sub)
    },
  )

  app.post(
    '',
    {
      schema: {
        tags: ['Links'],
        summary: 'Create a link',
        security: [{ bearerAuth: [] }],
        body: createLinkBody,
        response: { 201: linkResponse },
      },
    },
    async (request, reply) => {
      const link = await linksService.create(request.user.sub, request.body)

      return reply.status(201).send(link)
    },
  )

  app.put(
    '/reorder',
    {
      schema: {
        tags: ['Links'],
        summary: 'Reorder the links',
        description: 'Send every link id of the page in the new order.',
        security: [{ bearerAuth: [] }],
        body: reorderLinksBody,
        response: { 200: z.array(linkResponse) },
      },
    },
    async (request) => {
      return linksService.reorder(request.user.sub, request.body.linkIds)
    },
  )

  app.patch(
    '/:id',
    {
      schema: {
        tags: ['Links'],
        summary: 'Update a link',
        description: 'Partial update. Send isActive to show or hide the link.',
        security: [{ bearerAuth: [] }],
        params: linkParams,
        body: updateLinkBody,
        response: { 200: linkResponse },
      },
    },
    async (request) => {
      return linksService.update(request.user.sub, request.params.id, request.body)
    },
  )

  app.delete(
    '/:id',
    {
      schema: {
        tags: ['Links'],
        summary: 'Delete a link',
        security: [{ bearerAuth: [] }],
        params: linkParams,
        response: { 204: z.null() },
      },
    },
    async (request, reply) => {
      await linksService.delete(request.user.sub, request.params.id)

      return reply.status(204).send(null)
    },
  )
}
