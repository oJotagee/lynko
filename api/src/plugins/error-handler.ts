import type { FastifyError, FastifyInstance } from 'fastify'
import {
  hasZodFastifySchemaValidationErrors,
  isResponseSerializationError,
} from 'fastify-type-provider-zod'

import { AppError } from '../shared/errors'

export function registerErrorHandler(app: FastifyInstance) {
  app.setErrorHandler<FastifyError>((error, request, reply) => {
    if (hasZodFastifySchemaValidationErrors(error)) {
      return reply.status(400).send({
        message: 'Validation error',
        issues: error.validation.map((issue) => ({
          field: issue.instancePath.replace(/^\//, '').replaceAll('/', '.'),
          message: issue.message,
        })),
      })
    }

    if (isResponseSerializationError(error)) {
      request.log.error(error, 'Response serialization error')
      return reply.status(500).send({ message: 'Internal server error' })
    }

    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({ message: error.message })
    }

    if (error.statusCode && error.statusCode < 500) {
      return reply.status(error.statusCode).send({ message: error.message })
    }

    request.log.error(error)
    return reply.status(500).send({ message: 'Internal server error' })
  })
}
