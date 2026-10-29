import { buildApp } from './app'
import { env } from './config/env'

const app = buildApp()

try {
  await app.listen({ port: env.PORT })
} catch (err) {
  app.log.error(err)
  process.exit(1)
}
