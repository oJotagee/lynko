import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { domainRateLimit } from '../../plugins/security'
import {
  connectDomainBody,
  domainResponse,
  myDomainResponse,
  resolveQuery,
  resolveResponse,
} from './domains.dto'
import { domainsService } from './domains.service'

export const domainsRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/resolve',
    {
      config: { rateLimit: domainRateLimit.resolve },
      schema: {
        tags: ['Domains'],
        summary: 'Resolve a custom domain to its page',
        description:
          'Used by the web proxy. Only domains that are live resolve; others answer 404.',
        querystring: resolveQuery,
        response: { 200: resolveResponse },
      },
    },
    async (request) => {
      return domainsService.resolve(request.query.host)
    },
  )

  app.get(
    '/me',
    {
      onRequest: [app.authenticate],
      schema: {
        tags: ['Domains'],
        summary: 'Get the custom domain of the authenticated user',
        description: 'Returns null when no domain is connected.',
        security: [{ bearerAuth: [] }],
        response: { 200: myDomainResponse },
      },
    },
    async (request) => {
      return domainsService.getMine(request.user.sub)
    },
  )

  app.post(
    '/me',
    {
      onRequest: [app.authenticate],
      config: { rateLimit: domainRateLimit.create },
      schema: {
        tags: ['Domains'],
        summary: 'Connect a custom domain',
        description:
          'Pro only. Returns the DNS records to create. The domain goes live after the checks pass.',
        security: [{ bearerAuth: [] }],
        body: connectDomainBody,
        response: { 200: domainResponse },
      },
    },
    async (request) => {
      return domainsService.connect(request.user.sub, request.body.hostname)
    },
  )

  app.post(
    '/me/check',
    {
      onRequest: [app.authenticate],
      config: { rateLimit: domainRateLimit.check },
      schema: {
        tags: ['Domains'],
        summary: 'Check the DNS of the custom domain now',
        security: [{ bearerAuth: [] }],
        response: { 200: domainResponse },
      },
    },
    async (request) => {
      return domainsService.check(request.user.sub)
    },
  )

  app.delete(
    '/me',
    {
      onRequest: [app.authenticate],
      schema: {
        tags: ['Domains'],
        summary: 'Remove the custom domain',
        security: [{ bearerAuth: [] }],
        response: { 204: z.null() },
      },
    },
    async (request, reply) => {
      await domainsService.remove(request.user.sub)

      return reply.status(204).send(null)
    },
  )
}
