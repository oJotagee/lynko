import scalarApiReference from '@scalar/fastify-api-reference'
import { jsonSchemaTransform } from 'fastify-type-provider-zod'
import type { FastifyInstance } from 'fastify'
import fastifySwagger from '@fastify/swagger'

export function registerSwagger(app: FastifyInstance) {
  app.register(fastifySwagger, {
    openapi: {
      openapi: '3.0.3',
      info: {
        title: 'Lynko API',
        description: 'API for Lynko application',
        version: '1.0.0',
      },
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
    },
    transform: jsonSchemaTransform,
  })

  app.register(scalarApiReference, {
    routePrefix: '/docs',
    hooks: {
      preHandler: (_request, reply, done) => {
        reply.header(
          'content-security-policy',
          [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline'",
            "style-src 'self' 'unsafe-inline' https:",
            "font-src 'self' data: https:",
            "img-src 'self' data: https:",
            "connect-src 'self'",
          ].join('; '),
        )
        done()
      },
    },
  })
}
