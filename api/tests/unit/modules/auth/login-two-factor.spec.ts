import { afterEach, beforeEach, describe, expect, it, mock, setSystemTime } from 'bun:test'
import { Secret, TOTP } from 'otpauth'
import { encryptSecret } from '../../../../src/modules/two-factor/two-factor.crypto'
import { hashPassword } from '../../../../src/shared/password'
import { createTestApp } from '../../support/app'
import { buildUser, type User } from '../../support/builders'
import { useInMemoryRepositories } from '../../support/memory-repositories'

const SECRET = 'JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP'

const userAgent =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'

function codeFor(offsetSeconds = 0) {
  return TOTP.generate({
    secret: Secret.fromBase32(SECRET),
    timestamp: Date.now() + offsetSeconds * 1000,
  })
}

function wrongCode() {
  return codeFor() === '000000' ? '111111' : '000000'
}

describe('login with two-factor', () => {
  let store: ReturnType<typeof useInMemoryRepositories>

  let app: Awaited<ReturnType<typeof createTestApp>>

  let user: User

  beforeEach(async () => {
    setSystemTime(new Date(Math.floor(Date.now() / 30_000) * 30_000 + 10_000))

    store = useInMemoryRepositories()

    app = await createTestApp()

    user = buildUser({
      email: 'maria@example.com',
      passwordHash: await hashPassword('right-pass'),
      totpSecret: encryptSecret(SECRET),
      totpEnabledAt: new Date(),
    })

    store.users.push(user)
  })

  afterEach(async () => {
    setSystemTime()

    await app.close()

    mock.restore()
  })

  async function startLogin() {
    const response = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: 'maria@example.com', password: 'right-pass' },
    })

    return response.json().challengeToken as string
  }

  function finish(payload: object) {
    return app.inject({
      method: 'POST',
      url: '/auth/login/two-factor',
      headers: { 'x-client-user-agent': userAgent },
      payload,
    })
  }

  it('keeps the login without two-factor as it was', async () => {
    store.users.push(
      buildUser({ email: 'joao@example.com', passwordHash: await hashPassword('right-pass') }),
    )

    const response = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: 'joao@example.com', password: 'right-pass' },
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().accessToken).toBeString()
  })

  it('returns a challenge and opens no session after the password', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: 'maria@example.com', password: 'right-pass' },
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({ twoFactorRequired: true, challengeToken: expect.any(String) })
    expect(response.cookies.find((cookie) => cookie.name === 'refreshToken')).toBeUndefined()
    expect(store.sessions).toHaveLength(0)
  })

  it('still answers 401 for a wrong password', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: 'maria@example.com', password: 'wrong-pass' },
    })

    expect(response.statusCode).toBe(401)
    expect(response.json()).not.toHaveProperty('challengeToken')
  })

  it('does not accept the challenge as a Bearer token', async () => {
    const challengeToken = await startLogin()

    const response = await app.inject({
      method: 'GET',
      url: '/users/me',
      headers: { authorization: `Bearer ${challengeToken}` },
    })

    expect(response.statusCode).toBe(401)
  })

  it('opens the session with a code from the app', async () => {
    const challengeToken = await startLogin()

    const response = await finish({ challengeToken, code: codeFor() })

    expect(response.statusCode).toBe(200)
    expect(response.json().accessToken).toBeString()
    expect(response.cookies.find((cookie) => cookie.name === 'refreshToken')).toBeDefined()
    expect(store.sessions).toHaveLength(1)
    expect(store.sessions[0]?.userAgent).toBe(userAgent)

    const me = await app.inject({
      method: 'GET',
      url: '/users/me',
      headers: { authorization: `Bearer ${response.json().accessToken}` },
    })

    expect(me.statusCode).toBe(200)
  })

  it('opens the session with a recovery code once', async () => {
    const { createHmac } = await import('node:crypto')

    const { env } = await import('../../../../src/config/env')

    const codeHash = createHmac('sha256', env.TOTP_ENCRYPTION_KEY)
      .update('abcdefghij')
      .digest('hex')

    store.recoveryCodes.push({ userId: user.id, codeHash, usedAt: null })

    const challengeToken = await startLogin()

    const first = await finish({ challengeToken, recoveryCode: 'ABCDE-FGHIJ' })

    const second = await finish({ challengeToken, recoveryCode: 'abcde-fghij' })

    expect(first.statusCode).toBe(200)
    expect(second.statusCode).toBe(401)
    expect(store.recoveryCodes[0]?.usedAt).toBeInstanceOf(Date)
  })

  it('answers 401 for a wrong code and counts the failure', async () => {
    const challengeToken = await startLogin()

    const response = await finish({ challengeToken, code: wrongCode() })

    expect(response.statusCode).toBe(401)
    expect(response.json()).toEqual({ message: 'Invalid code' })
    expect(user.totpFailedAttempts).toBe(1)
    expect(store.sessions).toHaveLength(0)
  })

  it('locks after 5 wrong codes, even for the right one, and clears after a success', async () => {
    const challengeToken = await startLogin()

    for (let attempt = 0; attempt < 5; attempt++) {
      await finish({ challengeToken, code: wrongCode() })
    }

    const locked = await finish({ challengeToken, code: codeFor() })

    expect(locked.statusCode).toBe(429)
    expect(store.sessions).toHaveLength(0)

    setSystemTime(new Date(Date.now() + 16 * 60_000))

    const freshChallenge = await startLogin()

    const unlocked = await finish({ challengeToken: freshChallenge, code: codeFor() })

    expect(unlocked.statusCode).toBe(200)
    expect(user.totpFailedAttempts).toBe(0)
    expect(user.totpLockedUntil).toBeNull()
  })

  it('answers 401 for an expired challenge', async () => {
    const challengeToken = await startLogin()

    setSystemTime(new Date(Date.now() + 6 * 60_000))

    const response = await finish({ challengeToken, code: codeFor() })

    expect(response.statusCode).toBe(401)
    expect(response.json()).toEqual({ message: 'Two-factor challenge expired' })
  })

  it('does not accept an access token as a challenge', async () => {
    const challengeToken = app.jwt.sign({ sub: user.id, sid: crypto.randomUUID() })

    const response = await finish({ challengeToken, code: codeFor() })

    expect(response.statusCode).toBe(401)
  })

  it('answers 401 when two-factor was disabled after the challenge', async () => {
    const challengeToken = await startLogin()

    Object.assign(user, { totpSecret: null, totpEnabledAt: null })

    const response = await finish({ challengeToken, code: codeFor() })

    expect(response.statusCode).toBe(401)
    expect(store.sessions).toHaveLength(0)
  })

  it('answers 401 when the password changed after the challenge', async () => {
    const challengeToken = await startLogin()

    user.passwordHash = await hashPassword('new-password-1')

    const response = await finish({ challengeToken, code: codeFor(30) })

    expect(response.statusCode).toBe(401)
  })

  it('answers 400 for a body with both factors', async () => {
    const challengeToken = await startLogin()

    const response = await finish({ challengeToken, code: codeFor(), recoveryCode: 'abcde-fghij' })

    expect(response.statusCode).toBe(400)
  })
})
