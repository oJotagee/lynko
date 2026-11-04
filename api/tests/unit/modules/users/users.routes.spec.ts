import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'

import { useInMemoryRepositories } from '../../support/memory-repositories'
import { createTestApp, signIn } from '../../support/app'

describe('users routes', () => {
  let store: ReturnType<typeof useInMemoryRepositories>

  let app: Awaited<ReturnType<typeof createTestApp>>

  beforeEach(async () => {
    store = useInMemoryRepositories()

    app = await createTestApp()
  })

  afterEach(async () => {
    await app.close()

    mock.restore()
  })

  it('GET /users/me returns the authenticated user without the hash', async () => {
    const { user, headers } = signIn(app, store)

    const response = await app.inject({ method: 'GET', url: '/users/me', headers })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toMatchObject({ id: user.id, email: user.email })
    expect(response.json()).not.toHaveProperty('passwordHash')
  })

  it('GET /users/me returns 401 without a token', async () => {
    const response = await app.inject({ method: 'GET', url: '/users/me' })

    expect(response.statusCode).toBe(401)
  })

  it('GET /users/me returns 401 when the session was revoked', async () => {
    const { session, headers } = signIn(app, store)

    session.revokedAt = new Date()

    const response = await app.inject({ method: 'GET', url: '/users/me', headers })

    expect(response.statusCode).toBe(401)
    expect(response.json()).toEqual({ message: 'Session expired or revoked' })
  })
})
