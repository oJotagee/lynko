import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'

import { useInMemoryRepositories } from '../../support/memory-repositories'
import { hashPassword } from '../../../../src/shared/password'
import { buildUser } from '../../support/builders'
import { createTestApp } from '../../support/app'

describe('auth routes', () => {
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

  function getRefreshCookie(response: { cookies: { name: string; value: string }[] }) {
    return response.cookies.find((cookie) => cookie.name === 'refreshToken')
  }

  it('POST /auth/register normalizes the e-mail and never returns the hash', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: { name: 'Maria Silva', email: ' Maria@Example.com ', password: 'secret-password' },
    })

    expect(response.statusCode).toBe(201)
    expect(response.json()).toMatchObject({ name: 'Maria Silva', email: 'maria@example.com' })
    expect(response.json()).not.toHaveProperty('passwordHash')
  })

  it('POST /auth/register returns 409 for a used e-mail', async () => {
    store.users.push(buildUser({ email: 'maria@example.com' }))

    const response = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: { name: 'Maria', email: 'maria@example.com', password: 'secret-password' },
    })

    expect(response.statusCode).toBe(409)
    expect(response.json()).toEqual({ message: 'Email already in use' })
  })

  it('POST /auth/register returns 400 with the invalid fields', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: { name: 'M', email: 'invalid', password: 'short' },
    })

    expect(response.statusCode).toBe(400)
    expect(response.json().message).toBe('Validation error')
  })

  describe('session', () => {
    beforeEach(async () => {
      store.users.push(
        buildUser({ email: 'maria@example.com', passwordHash: await hashPassword('right-pass') }),
      )
    })

    async function login(password = 'right-pass') {
      return app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: { email: 'maria@example.com', password },
      })
    }

    it('POST /auth/login returns the access token and sets an httpOnly refresh cookie', async () => {
      const response = await login()

      expect(response.statusCode).toBe(200)
      expect(response.json().accessToken).toBeString()
      expect(getRefreshCookie(response)).toMatchObject({
        httpOnly: true,
        sameSite: 'Strict',
        path: '/auth',
      })
    })

    it('POST /auth/login returns 401 for a wrong password', async () => {
      const response = await login('wrong-pass')

      expect(response.statusCode).toBe(401)
      expect(getRefreshCookie(response)).toBeUndefined()
    })

    it('POST /auth/refresh rotates the cookie and logout ends the session', async () => {
      const cookie = getRefreshCookie(await login())?.value ?? ''

      const refreshed = await app.inject({
        method: 'POST',
        url: '/auth/refresh',
        cookies: { refreshToken: cookie },
      })
      const rotated = getRefreshCookie(refreshed)?.value ?? ''

      expect(refreshed.statusCode).toBe(200)
      expect(rotated).not.toBe(cookie)

      const logout = await app.inject({
        method: 'POST',
        url: '/auth/logout',
        cookies: { refreshToken: rotated },
      })

      expect(logout.statusCode).toBe(204)
      expect(store.sessions[0]?.revokedAt).not.toBeNull()
    })

    it('POST /auth/refresh returns 401 and clears the cookie without a valid token', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/refresh',
        cookies: { refreshToken: 'invalid' },
      })

      expect(response.statusCode).toBe(401)
      expect(getRefreshCookie(response)?.value).toBe('')
    })
  })
})
