import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { pagesService } from './pages.service'
import {
  createPageBody,
  pageResponse,
  publicPageResponse,
  updatePageBody,
  usernameParams,
} from './pages.dto'

export const pagesRoutes: FastifyPluginAsyncZod = async (app) => {
  app.post(
    '',
    {
      onRequest: [app.authenticate],
      schema: {
        tags: ['Pages'],
        summary: 'Create the authenticated user page',
        security: [{ bearerAuth: [] }],
        body: createPageBody,
        response: { 201: pageResponse },
      },
    },
    async (request, reply) => {
      const page = await pagesService.create(request.user.sub, request.body)

      return reply.status(201).send(page)
    },
  )

  app.get(
    '/me',
    {
      onRequest: [app.authenticate],
      schema: {
        tags: ['Pages'],
        summary: 'Get the authenticated user page',
        security: [{ bearerAuth: [] }],
        response: { 200: pageResponse },
      },
    },
    async (request) => {
      return pagesService.getMine(request.user.sub)
    },
  )

  app.patch(
    '/me',
    {
      onRequest: [app.authenticate],
      schema: {
        tags: ['Pages'],
        summary: 'Update the authenticated user page',
        description: 'Partial update. Send isPublished to publish or unpublish the page.',
        security: [{ bearerAuth: [] }],
        body: updatePageBody,
        response: { 200: pageResponse },
      },
    },
    async (request) => {
      return pagesService.updateMine(request.user.sub, request.body)
    },
  )

  app.delete(
    '/me',
    {
      onRequest: [app.authenticate],
      schema: {
        tags: ['Pages'],
        summary: 'Delete the authenticated user page',
        security: [{ bearerAuth: [] }],
        response: { 204: z.null() },
      },
    },
    async (request, reply) => {
      await pagesService.deleteMine(request.user.sub)

      return reply.status(204).send(null)
    },
  )

  app.get(
    '/me/preview',
    {
      onRequest: [app.authenticate],
      schema: {
        tags: ['Pages'],
        summary: 'Preview the authenticated user page',
        description: 'Same output as the public page, even if it is not published yet.',
        security: [{ bearerAuth: [] }],
        response: { 200: publicPageResponse },
      },
    },
    async (request) => {
      return pagesService.getPreview(request.user.sub)
    },
  )

  app.get(
    '/:username',
    {
      schema: {
        tags: ['Pages'],
        summary: 'Get a published page by username',
        params: usernameParams,
        response: { 200: publicPageResponse },
      },
    },
    async (request) => {
      return pagesService.getPublic(request.params.username)
    },
  )
}
