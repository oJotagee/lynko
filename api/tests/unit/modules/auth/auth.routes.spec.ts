import { afterEach, beforeEach, describe, expect, it, mock, spyOn } from 'bun:test'
import { env } from '../../../../src/config/env'
import { googleAuth } from '../../../../src/modules/auth/auth.google'
import { authTokens } from '../../../../src/modules/auth/auth.tokens'
import { mediaStorage } from '../../../../src/modules/media/media.storage'
import { UnauthorizedError } from '../../../../src/shared/errors'
import { hashPassword } from '../../../../src/shared/password'
import { createTestApp, signIn } from '../../support/app'
import { buildUser } from '../../support/builders'
import { useInMemoryRepositories } from '../../support/memory-repositories'

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

  describe('email verification', () => {
    it('POST /auth/verify-email verifies the e-mail with a valid link', async () => {
      const { user } = signIn(app, store)

      const token = await authTokens.issue(user.id, 'email_verification')

      const response = await app.inject({
        method: 'POST',
        url: '/auth/verify-email',
        payload: { token },
      })

      expect(response.statusCode).toBe(204)
      expect(store.users[0]?.emailVerifiedAt).toBeInstanceOf(Date)
    })

    it('POST /auth/verify-email returns 400 for an invalid link', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/verify-email',
        payload: { token: 'invalid' },
      })

      expect(response.statusCode).toBe(400)
      expect(response.json()).toEqual({ message: 'Invalid or expired token' })
    })

    it('POST /auth/verify-email returns 400 for an empty body', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/verify-email',
        payload: {},
      })

      expect(response.statusCode).toBe(400)
    })

    it('POST /auth/verify-email/resend returns 401 without a session', async () => {
      const response = await app.inject({ method: 'POST', url: '/auth/verify-email/resend' })

      expect(response.statusCode).toBe(401)
    })

    it('POST /auth/verify-email/resend sends the link and then answers 429', async () => {
      const { headers } = signIn(app, store)

      const first = await app.inject({
        method: 'POST',
        url: '/auth/verify-email/resend',
        headers,
      })

      expect(first.statusCode).toBe(202)
      expect(first.json()).toEqual({ retryAfter: 60 })

      const second = await app.inject({
        method: 'POST',
        url: '/auth/verify-email/resend',
        headers,
      })

      expect(second.statusCode).toBe(429)
    })

    it('POST /auth/verify-email/resend returns 409 for a verified e-mail', async () => {
      const { headers } = signIn(app, store, { user: { emailVerifiedAt: new Date() } })

      const response = await app.inject({
        method: 'POST',
        url: '/auth/verify-email/resend',
        headers,
      })

      expect(response.statusCode).toBe(409)
    })
  })

  describe('password reset', () => {
    async function forgot(email: string) {
      return app.inject({ method: 'POST', url: '/auth/forgot-password', payload: { email } })
    }

    it('POST /auth/forgot-password answers 204 for every kind of account', async () => {
      store.users.push(
        buildUser({ email: 'maria@example.com', passwordHash: await hashPassword('old-password') }),
        buildUser({ email: 'google@example.com', passwordHash: null }),
      )

      const responses = [
        await forgot('maria@example.com'),
        await forgot('google@example.com'),
        await forgot('nobody@example.com'),
      ]

      for (const response of responses) {
        expect(response.statusCode).toBe(204)

        expect(response.body).toBe('')
      }
    })

    it('POST /auth/forgot-password returns 400 for an invalid e-mail', async () => {
      const response = await forgot('invalid')

      expect(response.statusCode).toBe(400)
    })

    it('POST /auth/reset-password sets the new password', async () => {
      const user = buildUser({
        email: 'maria@example.com',
        passwordHash: await hashPassword('old-password'),
      })

      store.users.push(user)

      const token = await authTokens.issue(user.id, 'password_reset')

      const response = await app.inject({
        method: 'POST',
        url: '/auth/reset-password',
        payload: { token, password: 'new-password-1' },
      })

      expect(response.statusCode).toBe(204)

      const login = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: { email: 'maria@example.com', password: 'new-password-1' },
      })

      expect(login.statusCode).toBe(200)
    })

    it('POST /auth/reset-password returns 400 for an invalid link', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/reset-password',
        payload: { token: 'invalid', password: 'new-password-1' },
      })

      expect(response.statusCode).toBe(400)

      expect(response.json()).toEqual({ message: 'Invalid or expired token' })
    })

    it('POST /auth/reset-password returns 400 for a short password', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/reset-password',
        payload: { token: 'any', password: 'short' },
      })

      expect(response.statusCode).toBe(400)

      expect(response.json().message).toBe('Validation error')
    })
  })

  describe('google login', () => {
    it('POST /auth/google opens a session and sets the refresh cookie', async () => {
      spyOn(googleAuth, 'verifyIdToken').mockResolvedValue({
        googleId: 'google-1',
        email: 'maria@example.com',
        name: 'Maria Silva',
      })

      const response = await app.inject({
        method: 'POST',
        url: '/auth/google',
        payload: { idToken: 'token' },
      })

      expect(response.statusCode).toBe(200)

      expect(response.json().accessToken).toBeString()

      expect(getRefreshCookie(response)).toMatchObject({ httpOnly: true, path: '/auth' })

      expect(store.users).toHaveLength(1)
    })

    it('POST /auth/google returns 401 for an invalid token', async () => {
      spyOn(googleAuth, 'verifyIdToken').mockRejectedValue(
        new UnauthorizedError('Invalid Google token'),
      )

      const response = await app.inject({
        method: 'POST',
        url: '/auth/google',
        payload: { idToken: 'bad' },
      })

      expect(response.statusCode).toBe(401)

      expect(getRefreshCookie(response)).toBeUndefined()
    })

    it('POST /auth/google returns 503 when Google login is not configured', async () => {
      const original = env.GOOGLE_CLIENT_ID

      env.GOOGLE_CLIENT_ID = undefined

      try {
        const response = await app.inject({
          method: 'POST',
          url: '/auth/google',
          payload: { idToken: 'token' },
        })

        expect(response.statusCode).toBe(503)
      } finally {
        env.GOOGLE_CLIENT_ID = original
      }
    })

    it('POST /auth/google returns 400 for an empty body', async () => {
      const response = await app.inject({ method: 'POST', url: '/auth/google', payload: {} })

      expect(response.statusCode).toBe(400)
    })
  })

  describe('account deletion link', () => {
    beforeEach(() => {
      spyOn(mediaStorage, 'remove').mockResolvedValue(undefined)
    })

    it('POST /auth/confirm-deletion deletes the account with a valid link, without a session', async () => {
      const user = buildUser({ passwordHash: null })

      store.users.push(user, buildUser({ email: 'other@example.com' }))

      const token = await authTokens.issue(user.id, 'account_deletion')

      const response = await app.inject({
        method: 'POST',
        url: '/auth/confirm-deletion',
        payload: { token },
      })

      expect(response.statusCode).toBe(204)

      expect(store.users.map((item) => item.email)).toEqual(['other@example.com'])
    })

    it('POST /auth/confirm-deletion returns 400 for an invalid or wrong-type link', async () => {
      const user = buildUser({ passwordHash: null })

      store.users.push(user)

      const reset = await authTokens.issue(user.id, 'password_reset')

      const invalid = await app.inject({
        method: 'POST',
        url: '/auth/confirm-deletion',
        payload: { token: 'invalid' },
      })

      const wrongType = await app.inject({
        method: 'POST',
        url: '/auth/confirm-deletion',
        payload: { token: reset },
      })

      expect(invalid.statusCode).toBe(400)

      expect(invalid.json()).toEqual({ message: 'Invalid or expired token' })

      expect(wrongType.statusCode).toBe(400)

      expect(store.users).toHaveLength(1)
    })

    it('POST /auth/confirm-deletion returns 400 for an empty body', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/confirm-deletion',
        payload: {},
      })

      expect(response.statusCode).toBe(400)
    })
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
