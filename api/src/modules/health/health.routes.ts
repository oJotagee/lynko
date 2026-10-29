import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'

export const healthRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '',
    {
      schema: {
        tags: ['Health'],
        summary: 'Health check endpoint',
        response: {
          200: z.object({
            status: z.literal('ok'),
          }),
        },
      },
    },
    async () => {
      return { status: 'ok' as const }
    },
  )
}
