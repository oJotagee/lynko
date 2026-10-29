import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod'
import type { FastifyInstance } from 'fastify'

export function registerZod(app: FastifyInstance) {
  app.setValidatorCompiler(validatorCompiler)
  app.setSerializerCompiler(serializerCompiler)
}
