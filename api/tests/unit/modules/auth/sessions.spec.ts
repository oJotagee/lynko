import { afterEach, beforeEach, describe, expect, it, mock, spyOn } from 'bun:test'
import { googleAuth } from '../../../../src/modules/auth/auth.google'
import { hashPassword } from '../../../../src/shared/password'
import { createTestApp, signIn } from '../../support/app'
import { buildSession, buildUser } from '../../support/builders'
import { useInMemoryRepositories } from '../../support/memory-repositories'

const chromeWindows =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'

const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60_000)

describe('sessions', () => {
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

  describe('user agent on login', () => {
    it('stores the client user agent sent by the web on password login', async () => {
      store.users.push(
        buildUser({ email: 'maria@example.com', passwordHash: await hashPassword('right-pass') }),
      )

      const response = await app.inject({
        method: 'POST',
        url: '/auth/login',
        headers: { 'x-client-user-agent': chromeWindows },
        payload: { email: 'maria@example.com', password: 'right-pass' },
      })

      expect(response.statusCode).toBe(200)

      expect(store.sessions.at(-1)?.userAgent).toBe(chromeWindows)
    })

    it('stores the client user agent on Google login', async () => {
      spyOn(googleAuth, 'verifyIdToken').mockResolvedValue({
        googleId: 'google-1',
        email: 'maria@example.com',
        name: 'Maria Silva',
      })

      const response = await app.inject({
        method: 'POST',
        url: '/auth/google',
        headers: { 'x-client-user-agent': chromeWindows },
        payload: { idToken: 'token' },
      })

      expect(response.statusCode).toBe(200)

      expect(store.sessions.at(-1)?.userAgent).toBe(chromeWindows)
    })

    it('keeps the user agent empty without the header', async () => {
      store.users.push(
        buildUser({ email: 'maria@example.com', passwordHash: await hashPassword('right-pass') }),
      )

      await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: { email: 'maria@example.com', password: 'right-pass' },
      })

      expect(store.sessions.at(-1)?.userAgent).toBeNull()
    })
  })

  describe('GET /users/me/sessions', () => {
    it('lists only active sessions of the owner, the current one first', async () => {
      const { user, session, headers } = signIn(app, store)

      session.updatedAt = minutesAgo(30)

      const recent = buildSession({
        userId: user.id,
        userAgent: chromeWindows,
        updatedAt: minutesAgo(1),
      })

      const older = buildSession({ userId: user.id, updatedAt: minutesAgo(10) })

      store.sessions.push(
        older,
        recent,
        buildSession({ userId: user.id, revokedAt: new Date() }),
        buildSession({ userId: user.id, expiresAt: minutesAgo(1) }),
        buildSession(),
      )

      const response = await app.inject({ method: 'GET', url: '/users/me/sessions', headers })

      expect(response.statusCode).toBe(200)

      const body = response.json()

      expect(body.map((item: { id: string }) => item.id)).toEqual([session.id, recent.id, older.id])

      expect(body[0]).toMatchObject({ current: true, browser: null, os: null })

      expect(body[1]).toMatchObject({
        current: false,
        browser: 'Chrome',
        os: 'Windows',
        lastActiveAt: recent.updatedAt.toISOString(),
      })

      expect(body[1]).not.toHaveProperty('userAgent')
      expect(body[1]).not.toHaveProperty('refreshTokenHash')
    })

    it('returns 401 without a token', async () => {
      const response = await app.inject({ method: 'GET', url: '/users/me/sessions' })

      expect(response.statusCode).toBe(401)
    })
  })

  describe('DELETE /users/me/sessions/:id', () => {
    it('ends another session of the owner', async () => {
      const { user, headers } = signIn(app, store)

      const other = buildSession({ userId: user.id })

      store.sessions.push(other)

      const response = await app.inject({
        method: 'DELETE',
        url: `/users/me/sessions/${other.id}`,
        headers,
      })

      expect(response.statusCode).toBe(204)

      expect(other.revokedAt).toBeInstanceOf(Date)
    })

    it('returns 404 for a session of another account and keeps it', async () => {
      const { headers } = signIn(app, store)

      const foreign = buildSession()

      store.sessions.push(foreign)

      const response = await app.inject({
        method: 'DELETE',
        url: `/users/me/sessions/${foreign.id}`,
        headers,
      })

      expect(response.statusCode).toBe(404)

      expect(foreign.revokedAt).toBeNull()
    })

    it('returns 404 for a session already ended', async () => {
      const { user, headers } = signIn(app, store)

      const ended = buildSession({ userId: user.id, revokedAt: new Date() })

      store.sessions.push(ended)

      const response = await app.inject({
        method: 'DELETE',
        url: `/users/me/sessions/${ended.id}`,
        headers,
      })

      expect(response.statusCode).toBe(404)
    })

    it('returns 400 for the current session', async () => {
      const { session, headers } = signIn(app, store)

      const response = await app.inject({
        method: 'DELETE',
        url: `/users/me/sessions/${session.id}`,
        headers,
      })

      expect(response.statusCode).toBe(400)

      expect(session.revokedAt).toBeNull()
    })

    it('returns 400 for an invalid id', async () => {
      const { headers } = signIn(app, store)

      const response = await app.inject({
        method: 'DELETE',
        url: '/users/me/sessions/not-a-uuid',
        headers,
      })

      expect(response.statusCode).toBe(400)
    })

    it('makes the ended session lose access right away', async () => {
      const { user, headers } = signIn(app, store)

      const other = buildSession({ userId: user.id })

      store.sessions.push(other)

      const otherToken = app.jwt.sign({ sub: user.id, sid: other.id })

      await app.inject({ method: 'DELETE', url: `/users/me/sessions/${other.id}`, headers })

      const response = await app.inject({
        method: 'GET',
        url: '/users/me',
        headers: { authorization: `Bearer ${otherToken}` },
      })

      expect(response.statusCode).toBe(401)
    })
  })

  describe('DELETE /users/me/sessions', () => {
    it('ends every other session of the owner and keeps the current one', async () => {
      const { user, session, headers } = signIn(app, store)

      const others = [buildSession({ userId: user.id }), buildSession({ userId: user.id })]

      const foreign = buildSession()

      store.sessions.push(...others, foreign)

      const response = await app.inject({ method: 'DELETE', url: '/users/me/sessions', headers })

      expect(response.statusCode).toBe(200)

      expect(response.json()).toEqual({ revoked: 2 })

      expect(session.revokedAt).toBeNull()

      expect(foreign.revokedAt).toBeNull()

      for (const other of others) expect(other.revokedAt).toBeInstanceOf(Date)
    })

    it('returns 401 without a token', async () => {
      const response = await app.inject({ method: 'DELETE', url: '/users/me/sessions' })

      expect(response.statusCode).toBe(401)
    })
  })
})
