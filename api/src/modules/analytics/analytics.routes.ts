import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { analyticsRateLimit } from '../../plugins/security'
import {
  linkRedirectParams,
  overviewResponse,
  periodQuery,
  recordViewBody,
  socialRedirectParams,
  socialResponse,
  timeseriesResponse,
  topLinksResponse,
} from './analytics.dto'
import { analyticsService } from './analytics.service'

export const analyticsRoutes: FastifyPluginAsyncZod = async (app) => {
  app.post(
    '/views',
    {
      config: { rateLimit: analyticsRateLimit.views },
      schema: {
        tags: ['Analytics'],
        summary: 'Record a public page view',
        body: recordViewBody,
      },
    },
    async (request, reply) => {
      await analyticsService.recordView(request.body, request.headers['user-agent'])

      return reply.code(202).send()
    },
  )

  app.get(
    '/overview',
    {
      onRequest: [app.authenticate],
      schema: {
        tags: ['Analytics'],
        summary: 'Get the overview totals of the authenticated user page',
        security: [{ bearerAuth: [] }],
        querystring: periodQuery,
        response: { 200: overviewResponse },
      },
    },
    async (request) => {
      return analyticsService.getOverview(request.user.sub, request.query.period)
    },
  )

  app.get(
    '/timeseries',
    {
      onRequest: [app.authenticate],
      schema: {
        tags: ['Analytics'],
        summary: 'Get the daily views and clicks of the authenticated user page',
        security: [{ bearerAuth: [] }],
        querystring: periodQuery,
        response: { 200: timeseriesResponse },
      },
    },
    async (request) => {
      return analyticsService.getTimeseries(request.user.sub, request.query.period)
    },
  )

  app.get(
    '/links',
    {
      onRequest: [app.authenticate],
      schema: {
        tags: ['Analytics'],
        summary: 'Get the most clicked links of the authenticated user page',
        security: [{ bearerAuth: [] }],
        querystring: periodQuery,
        response: { 200: topLinksResponse },
      },
    },
    async (request) => {
      return analyticsService.getTopLinks(request.user.sub, request.query.period)
    },
  )

  app.get(
    '/social',
    {
      onRequest: [app.authenticate],
      schema: {
        tags: ['Analytics'],
        summary: 'Get the social clicks of the authenticated user page',
        security: [{ bearerAuth: [] }],
        querystring: periodQuery,
        response: { 200: socialResponse },
      },
    },
    async (request) => {
      return analyticsService.getSocial(request.user.sub, request.query.period)
    },
  )
}

export const redirectRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/:linkId',
    {
      schema: {
        tags: ['Analytics'],
        summary: 'Track a link click and redirect to its destination',
        params: linkRedirectParams,
      },
    },
    async (request, reply) => {
      const url = await analyticsService.resolveLinkRedirect(
        request.params.linkId,
        request.headers['user-agent'],
      )

      return reply.header('cache-control', 'no-store').redirect(url, 302)
    },
  )

  app.get(
    '/social/:pageId/:platform',
    {
      schema: {
        tags: ['Analytics'],
        summary: 'Track a social click and redirect to its destination',
        params: socialRedirectParams,
      },
    },
    async (request, reply) => {
      const url = await analyticsService.resolveSocialRedirect(
        request.params.pageId,
        request.params.platform,
        request.headers['user-agent'],
      )

      return reply.header('cache-control', 'no-store').redirect(url, 302)
    },
  )
}
