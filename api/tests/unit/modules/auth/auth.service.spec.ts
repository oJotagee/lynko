import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  type Mock,
  mock,
  setSystemTime,
  spyOn,
} from 'bun:test'
import { googleAuth } from '../../../../src/modules/auth/auth.google'
import { authRepository } from '../../../../src/modules/auth/auth.repository'
import { authService } from '../../../../src/modules/auth/auth.service'
import { mailService } from '../../../../src/modules/mail/mail.service'
import {
  BadRequestError,
  ConflictError,
  TooManyRequestsError,
  UnauthorizedError,
} from '../../../../src/shared/errors'
import { hashPassword } from '../../../../src/shared/password'
import { createRefreshToken } from '../../../../src/shared/token'
import { buildSession, buildUser } from '../../support/builders'
import { useInMemoryRepositories } from '../../support/memory-repositories'

describe('authService', () => {
  let store: ReturnType<typeof useInMemoryRepositories>

  beforeEach(() => {
    store = useInMemoryRepositories()
  })

  function lastToken() {
    const text = store.mails.at(-1)?.text ?? ''

    return decodeURIComponent(/token=(\S+)/.exec(text)?.[1] ?? '')
  }

  async function flush() {
    await Bun.sleep(0)
  }

  afterEach(() => {
    setSystemTime()
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

  describe('email verification', () => {
    const credentials = { name: 'Maria', email: 'maria@example.com', password: 'secret-123' }

    it('register sends the verification e-mail', async () => {
      await authService.register(credentials)

      await flush()

      expect(store.mails).toHaveLength(1)

      expect(store.mails[0]?.to).toBe('maria@example.com')

      expect(lastToken()).not.toBe('')
    })

    it('register survives a mail failure', async () => {
      spyOn(mailService, 'send').mockRejectedValue(new Error('smtp down'))

      spyOn(console, 'error').mockImplementation(() => {})

      await expect(authService.register(credentials)).resolves.toMatchObject({
        email: 'maria@example.com',
      })

      await flush()

      expect(store.users).toHaveLength(1)
    })

    it('verifyEmail marks the e-mail as verified', async () => {
      await authService.register(credentials)

      await flush()

      await authService.verifyEmail(lastToken())

      expect(store.users[0]?.emailVerifiedAt).toBeInstanceOf(Date)
    })

    it('verifyEmail rejects a used link', async () => {
      await authService.register(credentials)

      await flush()

      const token = lastToken()

      await authService.verifyEmail(token)

      await expect(authService.verifyEmail(token)).rejects.toBeInstanceOf(BadRequestError)
    })

    it('verifyEmail rejects an expired link', async () => {
      await authService.register(credentials)

      await flush()

      setSystemTime(new Date(Date.now() + 25 * 60 * 60 * 1000))

      await expect(authService.verifyEmail(lastToken())).rejects.toBeInstanceOf(BadRequestError)

      expect(store.users[0]?.emailVerifiedAt).toBeNull()
    })

    it('resendVerification invalidates the previous link', async () => {
      await authService.register(credentials)

      await flush()

      const previous = lastToken()

      setSystemTime(new Date(Date.now() + 61 * 1000))

      const userId = store.users[0]?.id ?? ''

      await expect(authService.resendVerification(userId)).resolves.toEqual({ retryAfter: 60 })

      await expect(authService.verifyEmail(previous)).rejects.toBeInstanceOf(BadRequestError)

      await authService.verifyEmail(lastToken())

      expect(store.users[0]?.emailVerifiedAt).toBeInstanceOf(Date)
    })

    it('resendVerification answers 429 within 60 seconds', async () => {
      await authService.register(credentials)

      await flush()

      await expect(authService.resendVerification(store.users[0]?.id ?? '')).rejects.toBeInstanceOf(
        TooManyRequestsError,
      )
    })

    it('resendVerification accepts only one of two concurrent calls', async () => {
      const user = buildUser()

      store.users.push(user)

      const results = await Promise.allSettled([
        authService.resendVerification(user.id),
        authService.resendVerification(user.id),
      ])

      await flush()

      expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1)

      expect(
        results.filter(
          (result) => result.status === 'rejected' && result.reason instanceof TooManyRequestsError,
        ),
      ).toHaveLength(1)

      expect(store.mails).toHaveLength(1)
    })

    it('resendVerification answers 409 for a verified e-mail', async () => {
      const user = buildUser({ emailVerifiedAt: new Date() })

      store.users.push(user)

      await expect(authService.resendVerification(user.id)).rejects.toBeInstanceOf(ConflictError)
    })
  })

  describe('password reset', () => {
    const email = 'maria@example.com'

    beforeEach(async () => {
      store.users.push(buildUser({ email, passwordHash: await hashPassword('old-password') }))
    })

    it('forgotPassword resolves the same for unknown and Google-only accounts, without e-mail', async () => {
      store.users.push(buildUser({ email: 'google@example.com', passwordHash: null }))

      await expect(
        authService.forgotPassword({ email: 'nobody@example.com' }),
      ).resolves.toBeUndefined()

      await expect(
        authService.forgotPassword({ email: 'google@example.com' }),
      ).resolves.toBeUndefined()

      await flush()

      expect(store.mails).toHaveLength(0)
    })

    it('forgotPassword e-mails the reset link to an account with a password', async () => {
      await expect(authService.forgotPassword({ email })).resolves.toBeUndefined()

      await flush()

      expect(store.mails).toHaveLength(1)

      expect(store.mails[0]?.to).toBe(email)

      expect(store.mails[0]?.text).toContain('/reset-password?token=')
    })

    it('forgotPassword does not send again within 60 seconds', async () => {
      await authService.forgotPassword({ email })

      await authService.forgotPassword({ email })

      await flush()

      expect(store.mails).toHaveLength(1)
    })

    it('resetPassword changes the password, revokes every session and sends the notice', async () => {
      const user = store.users[0]

      const session = buildSession({ userId: user?.id })

      const other = buildSession({ userId: user?.id })

      store.sessions.push(session, other)

      await authService.forgotPassword({ email })

      await flush()

      await authService.resetPassword({ token: lastToken(), password: 'new-password-1' })

      await flush()

      await expect(authService.login({ email, password: 'old-password' })).rejects.toBeInstanceOf(
        UnauthorizedError,
      )

      await expect(authService.login({ email, password: 'new-password-1' })).resolves.toBeDefined()

      expect(session.revokedAt).toBeInstanceOf(Date)

      expect(other.revokedAt).toBeInstanceOf(Date)

      expect(user?.emailVerifiedAt).toBeInstanceOf(Date)

      expect(store.mails.at(-1)?.to).toBe(email)

      expect(store.mails.at(-1)?.subject).toContain('alterada')
    })

    it('login started before a reset cannot leave an active session behind', async () => {
      await authService.forgotPassword({ email })

      await flush()

      const token = lastToken()

      const createSession = authRepository.createSession as unknown as Mock<
        typeof authRepository.createSession
      >

      const original = createSession.getMockImplementation()

      if (!original) throw new Error('createSession is not mocked')

      createSession.mockImplementation(async (...args) => {
        await authService.resetPassword({ token, password: 'new-password-1' })

        return original(...args)
      })

      await expect(authService.login({ email, password: 'old-password' })).rejects.toBeInstanceOf(
        UnauthorizedError,
      )

      expect(store.sessions.filter((session) => !session.revokedAt)).toHaveLength(0)
    })

    it('resetPassword rejects a used link', async () => {
      await authService.forgotPassword({ email })

      await flush()

      const token = lastToken()

      await authService.resetPassword({ token, password: 'new-password-1' })

      await expect(
        authService.resetPassword({ token, password: 'another-password' }),
      ).rejects.toBeInstanceOf(BadRequestError)
    })

    it('resetPassword rejects an expired and an invalid link', async () => {
      await authService.forgotPassword({ email })

      await flush()

      const token = lastToken()

      await expect(
        authService.resetPassword({ token: 'invalid', password: 'new-password-1' }),
      ).rejects.toBeInstanceOf(BadRequestError)

      setSystemTime(new Date(Date.now() + 31 * 60 * 1000))

      await expect(
        authService.resetPassword({ token, password: 'new-password-1' }),
      ).rejects.toBeInstanceOf(BadRequestError)
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

  describe('loginWithGoogle', () => {
    const claims = { googleId: 'google-1', email: 'maria@example.com', name: 'Maria Silva' }

    function mockToken(overrides: Partial<typeof claims> = {}) {
      return spyOn(googleAuth, 'verifyIdToken').mockResolvedValue({ ...claims, ...overrides })
    }

    it('creates a verified account without a password and opens a session', async () => {
      mockToken()

      const session = await authService.loginWithGoogle({ idToken: 'token' })

      expect(store.users).toHaveLength(1)

      expect(store.users[0]).toMatchObject({
        email: 'maria@example.com',
        name: 'Maria Silva',
        googleId: 'google-1',
        passwordHash: null,
      })

      expect(store.users[0]?.emailVerifiedAt).toBeInstanceOf(Date)

      expect(store.sessions).toHaveLength(1)

      expect(store.users[0]?.id).toBe(session.userId)

      expect(session.refreshToken.startsWith(session.sessionId)).toBe(true)
    })

    it('reuses the account on the next login', async () => {
      mockToken()

      await authService.loginWithGoogle({ idToken: 'token' })

      await authService.loginWithGoogle({ idToken: 'token' })

      expect(store.users).toHaveLength(1)

      expect(store.sessions).toHaveLength(2)
    })

    it('links a verified account by e-mail and keeps its password and sessions', async () => {
      const existing = buildUser({
        email: 'maria@example.com',
        passwordHash: await hashPassword('right-pass'),
        emailVerifiedAt: new Date(),
      })

      const hash = existing.passwordHash

      const earlier = buildSession({ userId: existing.id })

      store.users.push(existing)

      store.sessions.push(earlier)

      mockToken()

      await authService.loginWithGoogle({ idToken: 'token' })

      expect(store.users).toHaveLength(1)

      expect(existing.googleId).toBe('google-1')

      expect(existing.passwordHash).toBe(hash)

      expect(earlier.revokedAt).toBeNull()

      await expect(
        authService.login({ email: 'maria@example.com', password: 'right-pass' }),
      ).resolves.toBeDefined()
    })

    it('links an unverified account by e-mail but clears the password and old sessions', async () => {
      const squatted = buildUser({
        email: 'maria@example.com',
        passwordHash: await hashPassword('attacker-pass'),
        emailVerifiedAt: null,
      })

      const attackerSession = buildSession({ userId: squatted.id })

      store.users.push(squatted)

      store.sessions.push(attackerSession)

      mockToken()

      const session = await authService.loginWithGoogle({ idToken: 'token' })

      expect(squatted.googleId).toBe('google-1')

      expect(squatted.emailVerifiedAt).toBeInstanceOf(Date)

      expect(squatted.passwordHash).toBeNull()

      expect(attackerSession.revokedAt).toBeInstanceOf(Date)

      expect(store.sessions.find((item) => item.id === session.sessionId)?.revokedAt).toBeNull()

      await expect(
        authService.login({ email: 'maria@example.com', password: 'attacker-pass' }),
      ).rejects.toBeInstanceOf(UnauthorizedError)
    })

    it('a stale concurrent link has no effect and keeps the winning session active', async () => {
      const squatted = buildUser({
        email: 'maria@example.com',
        passwordHash: await hashPassword('attacker-pass'),
        emailVerifiedAt: null,
      })

      const stale = { ...squatted }

      store.users.push(squatted)

      mockToken()

      const winner = await authService.loginWithGoogle({ idToken: 'token' })

      spyOn(authRepository, 'findByGoogleId')
        .mockResolvedValueOnce(undefined)
        .mockResolvedValue(squatted)

      spyOn(authRepository, 'findByEmailWithPassword').mockResolvedValue(stale)

      const loser = await authService.loginWithGoogle({ idToken: 'token' })

      expect(loser.userId).toBe(winner.userId)

      expect(store.sessions.find((item) => item.id === winner.sessionId)?.revokedAt).toBeNull()

      expect(store.sessions.find((item) => item.id === loser.sessionId)?.revokedAt).toBeNull()
    })

    it('recovers when two logins link the same Google account at once', async () => {
      const existing = buildUser({ email: 'maria@example.com', googleId: null })

      store.users.push(existing)

      mockToken()

      spyOn(authRepository, 'findByGoogleId')
        .mockResolvedValueOnce(undefined)
        .mockResolvedValue({ ...existing, googleId: 'google-1' })

      spyOn(authRepository, 'linkGoogle').mockResolvedValue(false)

      await expect(authService.loginWithGoogle({ idToken: 'token' })).resolves.toMatchObject({
        userId: existing.id,
      })
    })

    it('refuses an e-mail already linked to another Google account', async () => {
      store.users.push(buildUser({ email: 'maria@example.com', googleId: 'google-other' }))

      mockToken()

      await expect(authService.loginWithGoogle({ idToken: 'token' })).rejects.toBeInstanceOf(
        ConflictError,
      )

      expect(store.sessions).toHaveLength(0)
    })

    it('rejects an e-mail longer than the column and creates nothing', async () => {
      mockToken({ email: `${'a'.repeat(45)}@example.com` })

      await expect(authService.loginWithGoogle({ idToken: 'token' })).rejects.toBeInstanceOf(
        BadRequestError,
      )

      expect(store.users).toHaveLength(0)
    })

    it('truncates a long name and falls back to the e-mail without one', async () => {
      mockToken({ name: 'x'.repeat(150) })

      await authService.loginWithGoogle({ idToken: 'token' })

      expect(store.users[0]?.name).toHaveLength(100)

      store.users.length = 0

      mockToken({ googleId: 'google-2', name: '' })

      await authService.loginWithGoogle({ idToken: 'token' })

      expect(store.users[0]?.name).toBe('maria')
    })

    it('creates nothing when the token is invalid', async () => {
      spyOn(googleAuth, 'verifyIdToken').mockRejectedValue(
        new UnauthorizedError('Invalid Google token'),
      )

      await expect(authService.loginWithGoogle({ idToken: 'bad' })).rejects.toBeInstanceOf(
        UnauthorizedError,
      )

      expect(store.users).toHaveLength(0)
    })

    it('a Google-only account cannot log in with a password', async () => {
      mockToken()

      await authService.loginWithGoogle({ idToken: 'token' })

      await expect(
        authService.login({ email: 'maria@example.com', password: 'any-password' }),
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
