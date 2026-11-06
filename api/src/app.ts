import Fastify from 'fastify'
import { cacheRedis } from './db/redis'
import { analyticsProducer } from './modules/analytics/analytics.queue'
import { analyticsRoutes, redirectRoutes } from './modules/analytics/analytics.routes'
import { authRoutes } from './modules/auth/auth.routes'
import { healthRoutes } from './modules/health/health.routes'
import { linksRoutes } from './modules/links/links.routes'
import { mediaRoutes } from './modules/media/media.routes'
import { setPublicPageCacheLogger } from './modules/pages/pages.cache'
import { pagesRoutes } from './modules/pages/pages.routes'
import { usersRoutes } from './modules/users/users.routes'
import { authPlugin } from './plugins/auth'
import { registerErrorHandler } from './plugins/error-handler'
import { registerSecurity } from './plugins/security'
import { registerSwagger } from './plugins/swagger'
import { registerZod } from './plugins/zod'

export function buildApp() {
  const isDev = process.env.NODE_ENV !== 'production'

  const app = Fastify({
    logger: isDev
      ? {
          transport: {
            target: 'pino-pretty',
            options: {
              translateTime: 'HH:MM:ss',
              ignore: 'pid,hostname',
            },
          },
        }
      : true,
    trustProxy: isDev ? false : (_address: string, hop: number) => hop === 0,
  })

  setPublicPageCacheLogger(app.log)

  app.addHook('onClose', async () => {
    cacheRedis?.disconnect()

    await analyticsProducer.close()
  })

  registerZod(app)

  registerErrorHandler(app)

  registerSecurity(app)

  registerSwagger(app)

  app.register(authPlugin)

  app.register(healthRoutes, { prefix: '/health' })
  app.register(authRoutes, { prefix: '/auth' })
  app.register(usersRoutes, { prefix: '/users' })
  app.register(pagesRoutes, { prefix: '/pages' })
  app.register(linksRoutes, { prefix: '/links' })
  app.register(mediaRoutes, { prefix: '/media' })
  app.register(analyticsRoutes, { prefix: '/analytics' })
  app.register(redirectRoutes, { prefix: '/r' })

  return app
}
