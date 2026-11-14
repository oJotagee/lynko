import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { billingRateLimit } from '../../plugins/security'
import {
  cancelResponse,
  checkoutBody,
  checkoutResponse,
  plansResponse,
  subscriptionResponse,
} from './billing.dto'
import { billingActions, billingService } from './billing.service'
import { verifyWebhook } from './billing.webhook'

export const billingRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/plans',
    {
      schema: {
        tags: ['Billing'],
        summary: 'List the Pro plan prices',
        description: 'Prices come from the AbacatePay products and are cached for 10 minutes.',
        response: { 200: plansResponse },
      },
    },
    async () => {
      return billingService.getPlans()
    },
  )

  app.get(
    '/subscription',
    {
      onRequest: [app.authenticate],
      schema: {
        tags: ['Billing'],
        summary: 'Get the plan and subscription of the authenticated user',
        security: [{ bearerAuth: [] }],
        response: { 200: subscriptionResponse },
      },
    },
    async (request) => {
      return billingService.getSubscription(request.user.sub)
    },
  )

  app.post(
    '/checkout',
    {
      onRequest: [app.authenticate],
      config: { rateLimit: billingRateLimit.checkout },
      schema: {
        tags: ['Billing'],
        summary: 'Start the Pro subscription checkout',
        description:
          'Returns the AbacatePay checkout URL. The plan only changes after the payment webhook.',
        security: [{ bearerAuth: [] }],
        body: checkoutBody,
        response: { 200: checkoutResponse },
      },
    },
    async (request) => {
      return billingActions.startCheckout(request.user.sub, request.body.cycle)
    },
  )

  app.post(
    '/subscription/cancel',
    {
      onRequest: [app.authenticate],
      config: { rateLimit: billingRateLimit.cancel },
      schema: {
        tags: ['Billing'],
        summary: 'Cancel the Pro subscription',
        description: 'Stops the next charges. Pro access stays until the end of the paid period.',
        security: [{ bearerAuth: [] }],
        response: { 200: cancelResponse },
      },
    },
    async (request) => {
      return billingActions.cancel(request.user.sub)
    },
  )

  app.register(async (webhook) => {
    webhook.addContentTypeParser(
      'application/json',
      { parseAs: 'buffer' },
      (_request, body, done) => done(null, body),
    )

    webhook.post(
      '/webhooks/abacatepay',
      {
        schema: {
          tags: ['Billing'],
          summary: 'Receive AbacatePay webhooks',
          description:
            'Checks the secret and the HMAC signature of the raw body. Events are applied once.',
          response: { 200: z.object({ received: z.literal(true) }) },
        },
      },
      async (request) => {
        const event = verifyWebhook(
          request.body as Buffer,
          request.headers,
          request.query as Record<string, unknown>,
        )

        await billingActions.handleWebhook(event)

        return { received: true as const }
      },
    )
  })
}
