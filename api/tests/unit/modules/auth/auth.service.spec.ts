import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'

import { ConflictError, UnauthorizedError } from '../../../../src/shared/errors'
import { useInMemoryRepositories } from '../../support/memory-repositories'
import { authService } from '../../../../src/modules/auth/auth.service'
import { createRefreshToken } from '../../../../src/shared/token'
import { buildSession, buildUser } from '../../support/builders'
import { hashPassword } from '../../../../src/shared/password'

describe('authService', () => {
  let store: ReturnType<typeof useInMemoryRepositories>

  beforeEach(() => {
    store = useInMemoryRepositories()
  })

  afterEach(() => {
    mock.restore()
  })

  describe('register', () => {
    it('creates the user with a hashed password and returns it without the hash', async () => {
      const user = await authService.register({
        name: 'Maria Silva',
        email: 'maria@example.com',
        password: 'secret-password',
      })

      expect(user).not.toHaveProperty('passwordHash')
      expect(store.users[0]?.passwordHash).not.toBe('secret-password')
    })

    it('throws ConflictError when the e-mail is already in use', async () => {
      store.users.push(buildUser({ email: 'maria@example.com' }))

      await expect(
        authService.register({ name: 'Maria', email: 'maria@example.com', password: 'secret-123' }),
      ).rejects.toBeInstanceOf(ConflictError)
    })
  })

  describe('login', () => {
    beforeEach(async () => {
      store.users.push(
        buildUser({ email: 'maria@example.com', passwordHash: await hashPassword('right-pass') }),
      )
    })

    it('opens a session and returns its refresh token', async () => {
      const session = await authService.login({
        email: 'maria@example.com',
        password: 'right-pass',
      })

      expect(store.sessions).toHaveLength(1)
      expect(store.sessions[0]?.id).toBe(session.sessionId)
      expect(session.refreshToken.startsWith(`${session.sessionId}.`)).toBe(true)
    })

    it('throws UnauthorizedError when the password is wrong', async () => {
      await expect(
        authService.login({ email: 'maria@example.com', password: 'wrong-pass' }),
      ).rejects.toBeInstanceOf(UnauthorizedError)

      expect(store.sessions).toHaveLength(0)
    })

    it('throws UnauthorizedError when the user does not exist', async () => {
      await expect(
        authService.login({ email: 'ghost@example.com', password: 'right-pass' }),
      ).rejects.toBeInstanceOf(UnauthorizedError)
    })
  })

  describe('refresh', () => {
    function storeSession(overrides: Parameters<typeof buildSession>[0] = {}) {
      const session = buildSession(overrides)

      const { token, secretHash } = createRefreshToken(session.id)

      session.refreshTokenHash = secretHash

      store.sessions.push(session)

      return { session, token }
    }

    it('rotates the refresh token of an active session', async () => {
      const { session, token } = storeSession()

      const refreshed = await authService.refresh(token)

      expect(refreshed.sessionId).toBe(session.id)
      expect(refreshed.refreshToken).not.toBe(token)
      await expect(authService.refresh(token)).rejects.toBeInstanceOf(UnauthorizedError)
    })

    it('revokes the session when an old secret is reused', async () => {
      const { session } = storeSession()

      const stolen = `${session.id}.old-secret`

      await expect(authService.refresh(stolen)).rejects.toBeInstanceOf(UnauthorizedError)
      expect(session.revokedAt).not.toBeNull()
    })

    it.each([
      ['expired', { expiresAt: new Date(Date.now() - 1000) }],
      ['revoked', { revokedAt: new Date() }],
    ])('rejects a %s session', async (_case, overrides) => {
      const { token } = storeSession(overrides)

      await expect(authService.refresh(token)).rejects.toBeInstanceOf(UnauthorizedError)
    })

    it('rejects a missing token', async () => {
      await expect(authService.refresh(undefined)).rejects.toBeInstanceOf(UnauthorizedError)
    })
  })

  describe('logout', () => {
    it('revokes the session of the refresh token', async () => {
      const session = buildSession()

      const { token, secretHash } = createRefreshToken(session.id)

      session.refreshTokenHash = secretHash

      store.sessions.push(session)

      await authService.logout(token)

      expect(session.revokedAt).not.toBeNull()
      expect(await authService.isSessionValid(session.id, session.userId)).toBe(false)
    })

    it('ignores an invalid token', async () => {
      await expect(authService.logout('invalid')).resolves.toBeUndefined()
    })
  })

  describe('isSessionValid', () => {
    it('only accepts the active session of the same user', async () => {
      const session = buildSession()

      store.sessions.push(session)

      expect(await authService.isSessionValid(session.id, session.userId)).toBe(true)
      expect(await authService.isSessionValid(session.id, 'another-user')).toBe(false)
    })
  })
})
