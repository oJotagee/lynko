import { afterEach, beforeEach, describe, expect, it, mock, spyOn } from 'bun:test'
import { mediaStorage } from '../../../../src/modules/media/media.storage'
import { hashPassword, verifyPassword } from '../../../../src/shared/password'
import { createTestApp, signIn } from '../../support/app'
import { useInMemoryRepositories } from '../../support/memory-repositories'

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

  describe('PATCH /users/me/password', () => {
    const payload = { currentPassword: 'old-password', newPassword: 'new-password-1' }

    async function signInWithPassword() {
      return signIn(app, store, { user: { passwordHash: await hashPassword('old-password') } })
    }

    it('changes the password and keeps the current session', async () => {
      const { user, session, headers } = await signInWithPassword()

      const response = await app.inject({
        method: 'PATCH',
        url: '/users/me/password',
        headers,
        payload,
      })

      expect(response.statusCode).toBe(204)

      expect(await verifyPassword('new-password-1', user.passwordHash)).toBe(true)

      expect(session.revokedAt).toBeNull()
    })

    it('returns 401 for a wrong current password', async () => {
      const { headers } = await signInWithPassword()

      const response = await app.inject({
        method: 'PATCH',
        url: '/users/me/password',
        headers,
        payload: { ...payload, currentPassword: 'wrong-password' },
      })

      expect(response.statusCode).toBe(401)
      expect(response.json()).toEqual({ message: 'Invalid current password' })
    })

    it('returns 400 when the new password equals the current one', async () => {
      const { headers } = await signInWithPassword()

      const response = await app.inject({
        method: 'PATCH',
        url: '/users/me/password',
        headers,
        payload: { currentPassword: 'old-password', newPassword: 'old-password' },
      })

      expect(response.statusCode).toBe(400)
    })

    it('returns 400 for a short new password', async () => {
      const { headers } = await signInWithPassword()

      const response = await app.inject({
        method: 'PATCH',
        url: '/users/me/password',
        headers,
        payload: { ...payload, newPassword: 'short' },
      })

      expect(response.statusCode).toBe(400)
    })

    it('returns 409 for an account without a password', async () => {
      const { headers } = signIn(app, store, { user: { passwordHash: null } })

      const response = await app.inject({
        method: 'PATCH',
        url: '/users/me/password',
        headers,
        payload,
      })

      expect(response.statusCode).toBe(409)
    })

    it('returns 401 without a token', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: '/users/me/password',
        payload,
      })

      expect(response.statusCode).toBe(401)
    })
  })

  describe('POST /users/me/deletion', () => {
    beforeEach(() => {
      spyOn(mediaStorage, 'remove').mockResolvedValue(undefined)
    })

    async function signInWithPage() {
      return signIn(app, store, {
        user: { passwordHash: await hashPassword('right-password') },
        page: { username: 'maria', isPublished: true },
      })
    }

    it('deletes the account and nothing stays reachable', async () => {
      const { headers } = await signInWithPage()

      const response = await app.inject({
        method: 'POST',
        url: '/users/me/deletion',
        headers,
        payload: { password: 'right-password' },
      })

      expect(response.statusCode).toBe(204)

      const profile = await app.inject({ method: 'GET', url: '/users/me', headers })

      expect(profile.statusCode).toBe(401)

      const publicPage = await app.inject({ method: 'GET', url: '/pages/maria' })

      expect(publicPage.statusCode).toBe(404)

      expect(store.users).toHaveLength(0)
    })

    it('returns 401 for a wrong or missing password and keeps the account', async () => {
      const { headers } = await signInWithPage()

      const wrong = await app.inject({
        method: 'POST',
        url: '/users/me/deletion',
        headers,
        payload: { password: 'wrong-password' },
      })

      const missing = await app.inject({
        method: 'POST',
        url: '/users/me/deletion',
        headers,
        payload: {},
      })

      expect(wrong.statusCode).toBe(401)

      expect(missing.statusCode).toBe(401)

      expect(store.users).toHaveLength(1)
    })

    it('returns 202 and deletes nothing yet for an account without a password', async () => {
      const { headers } = signIn(app, store, { user: { passwordHash: null } })

      const response = await app.inject({
        method: 'POST',
        url: '/users/me/deletion',
        headers,
        payload: {},
      })

      expect(response.statusCode).toBe(202)

      expect(response.json()).toEqual({ status: 'email_sent' })

      expect(store.users).toHaveLength(1)
    })

    it('returns 429 when the link is requested again within 60 seconds', async () => {
      const { headers } = signIn(app, store, { user: { passwordHash: null } })

      const first = await app.inject({
        method: 'POST',
        url: '/users/me/deletion',
        headers,
        payload: {},
      })

      const second = await app.inject({
        method: 'POST',
        url: '/users/me/deletion',
        headers,
        payload: {},
      })

      expect(first.statusCode).toBe(202)

      expect(second.statusCode).toBe(429)
    })

    it('returns 401 without a token', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/users/me/deletion',
        payload: { password: 'right-password' },
      })

      expect(response.statusCode).toBe(401)
    })
  })
})
