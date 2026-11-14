import { afterEach, beforeEach, describe, expect, it, mock, setSystemTime } from 'bun:test'
import { Secret, TOTP } from 'otpauth'
import { authTokens } from '../../../../src/modules/auth/auth.tokens'
import { decryptSecret, encryptSecret } from '../../../../src/modules/two-factor/two-factor.crypto'
import { twoFactorService } from '../../../../src/modules/two-factor/two-factor.service'
import { hashPassword } from '../../../../src/shared/password'
import { createTestApp, signIn } from '../../support/app'
import { buildSession } from '../../support/builders'
import { useInMemoryRepositories } from '../../support/memory-repositories'

function codeFor(secret: string, offsetSeconds = 0) {
  return TOTP.generate({
    secret: Secret.fromBase32(secret),
    timestamp: Date.now() + offsetSeconds * 1000,
  })
}

describe('two-factor crypto', () => {
  it('decrypts what it encrypted, with a new iv every time', () => {
    const first = encryptSecret('JBSWY3DPEHPK3PXP')

    const second = encryptSecret('JBSWY3DPEHPK3PXP')

    expect(first).not.toBe(second)
    expect(first).not.toContain('JBSWY3DPEHPK3PXP')
    expect(decryptSecret(first)).toBe('JBSWY3DPEHPK3PXP')
  })

  it('rejects a tampered or malformed payload', () => {
    const [iv, tag, ciphertext] = encryptSecret('JBSWY3DPEHPK3PXP').split('.')

    expect(() => decryptSecret(`${iv}.${tag}.${ciphertext}AA`)).toThrow()
    expect(() => decryptSecret('not-encrypted')).toThrow()
  })
})

describe('two-factor routes', () => {
  let store: ReturnType<typeof useInMemoryRepositories>

  let app: Awaited<ReturnType<typeof createTestApp>>

  beforeEach(async () => {
    setSystemTime(new Date(Math.floor(Date.now() / 30_000) * 30_000 + 10_000))

    store = useInMemoryRepositories()

    app = await createTestApp()
  })

  afterEach(async () => {
    setSystemTime()

    await app.close()

    mock.restore()
  })

  async function signInWithPassword() {
    return signIn(app, store, { user: { passwordHash: await hashPassword('right-pass') } })
  }

  function post(url: string, headers: Record<string, string>, payload?: object) {
    return app.inject({ method: 'POST', url: `/users/me/two-factor${url}`, headers, payload })
  }

  async function startSetup(headers: Record<string, string>) {
    const response = await post('/setup', headers, { password: 'right-pass' })

    return response.json() as { secret: string; otpauthUrl: string }
  }

  async function enableTwoFactor() {
    const signed = await signInWithPassword()

    const { secret } = await startSetup(signed.headers)

    const response = await post('/enable', signed.headers, { code: codeFor(secret) })

    return { ...signed, secret, recoveryCodes: response.json().recoveryCodes as string[] }
  }

  it('starts disabled', async () => {
    const { headers } = await signInWithPassword()

    const response = await app.inject({ method: 'GET', url: '/users/me/two-factor', headers })

    expect(response.json()).toEqual({ enabled: false, recoveryCodesLeft: 0 })
  })

  it('returns 401 without a token', async () => {
    const response = await post('/setup', {}, { password: 'right-pass' })

    expect(response.statusCode).toBe(401)
  })

  describe('setup', () => {
    it('returns the secret and the otpauth url and keeps only the encrypted pending secret', async () => {
      const { user, headers } = await signInWithPassword()

      const response = await post('/setup', headers, { password: 'right-pass' })

      expect(response.statusCode).toBe(200)

      const { secret, otpauthUrl } = response.json()

      expect(secret).toMatch(/^[A-Z2-7]{32}$/)
      expect(otpauthUrl).toStartWith('otpauth://totp/Lynko:')
      expect(otpauthUrl).toContain('issuer=Lynko')
      expect(otpauthUrl).toContain(`secret=${secret}`)

      expect(user.totpPendingSecret).not.toContain(secret)
      expect(decryptSecret(user.totpPendingSecret ?? '')).toBe(secret)
      expect(user.totpEnabledAt).toBeNull()
    })

    it('returns 401 for a wrong password', async () => {
      const { user, headers } = await signInWithPassword()

      const response = await post('/setup', headers, { password: 'wrong-pass' })

      expect(response.statusCode).toBe(401)
      expect(user.totpPendingSecret).toBeNull()
    })

    it('returns 400 for an account without a password', async () => {
      const { headers } = signIn(app, store, { user: { passwordHash: null, googleId: 'g-1' } })

      const response = await post('/setup', headers, { password: 'any-password' })

      expect(response.statusCode).toBe(400)
    })

    it('returns 409 when it is already enabled', async () => {
      const { headers } = await enableTwoFactor()

      const response = await post('/setup', headers, { password: 'right-pass' })

      expect(response.statusCode).toBe(409)
    })
  })

  describe('enable', () => {
    it('enables with a valid code, returns 10 recovery codes and ends the other sessions', async () => {
      const { user, session, headers } = await signInWithPassword()

      const other = buildSession({ userId: user.id })

      store.sessions.push(other)

      const { secret } = await startSetup(headers)

      const response = await post('/enable', headers, { code: codeFor(secret) })

      expect(response.statusCode).toBe(200)

      const { recoveryCodes } = response.json()

      expect(recoveryCodes).toHaveLength(10)
      expect(new Set(recoveryCodes).size).toBe(10)

      for (const code of recoveryCodes) expect(code).toMatch(/^[a-z2-7]{5}-[a-z2-7]{5}$/)

      expect(user.totpEnabledAt).toBeInstanceOf(Date)
      expect(user.totpPendingSecret).toBeNull()

      expect(store.recoveryCodes.map((item) => item.codeHash)).not.toContain(recoveryCodes[0])

      expect(session.revokedAt).toBeNull()
      expect(other.revokedAt).toBeInstanceOf(Date)

      expect(store.mails.at(-1)?.subject).toBe('Login em duas etapas ativado na Lynko')

      const status = await app.inject({ method: 'GET', url: '/users/me/two-factor', headers })

      expect(status.json()).toEqual({ enabled: true, recoveryCodesLeft: 10 })
    })

    it('returns 400 and changes nothing for a wrong code', async () => {
      const { user, headers } = await signInWithPassword()

      const { secret } = await startSetup(headers)

      const wrong = codeFor(secret) === '000000' ? '111111' : '000000'

      const response = await post('/enable', headers, { code: wrong })

      expect(response.statusCode).toBe(400)
      expect(user.totpEnabledAt).toBeNull()
      expect(store.recoveryCodes).toHaveLength(0)
    })

    it('returns 400 without a setup', async () => {
      const { headers } = await signInWithPassword()

      const response = await post('/enable', headers, { code: '123456' })

      expect(response.statusCode).toBe(400)
    })

    it('returns 400 for a code that is not 6 digits', async () => {
      const { headers } = await signInWithPassword()

      const response = await post('/enable', headers, { code: '12a456' })

      expect(response.statusCode).toBe(400)
    })

    it('never returns the secret after it is enabled', async () => {
      const { headers, secret } = await enableTwoFactor()

      const me = await app.inject({ method: 'GET', url: '/users/me', headers })

      const status = await app.inject({ method: 'GET', url: '/users/me/two-factor', headers })

      expect(me.json().twoFactorEnabled).toBe(true)
      expect(me.body).not.toContain(secret)
      expect(me.body).not.toContain('totp')
      expect(status.body).not.toContain(secret)
    })
  })

  describe('codes', () => {
    it('does not accept the same app code twice', async () => {
      const { user, secret } = await enableTwoFactor()

      expect(await twoFactorService.verify(user, { code: codeFor(secret) })).toBe(false)

      expect(await twoFactorService.verify(user, { code: codeFor(secret, 30) })).toBe(true)
    })

    it('accepts each recovery code once, in any case and without the dash', async () => {
      const { user, headers, recoveryCodes } = await enableTwoFactor()

      const [first = ''] = recoveryCodes

      const typed = first.replace('-', '').toUpperCase()

      expect(await twoFactorService.verify(user, { recoveryCode: typed })).toBe(true)
      expect(await twoFactorService.verify(user, { recoveryCode: first })).toBe(false)

      const status = await app.inject({ method: 'GET', url: '/users/me/two-factor', headers })

      expect(status.json().recoveryCodesLeft).toBe(9)
    })

    it('keeps two-factor enabled after a password reset', async () => {
      const { user } = await enableTwoFactor()

      const token = await authTokens.issue(user.id, 'password_reset')

      const response = await app.inject({
        method: 'POST',
        url: '/auth/reset-password',
        payload: { token, password: 'new-password-1' },
      })

      expect(response.statusCode).toBe(204)
      expect(user.totpEnabledAt).toBeInstanceOf(Date)
      expect(store.recoveryCodes.filter((item) => item.userId === user.id)).toHaveLength(10)
    })
  })

  describe('recovery codes', () => {
    it('replaces the codes with the password and an app code', async () => {
      const { headers, secret, recoveryCodes } = await enableTwoFactor()

      const response = await post('/recovery-codes', headers, {
        password: 'right-pass',
        code: codeFor(secret, 30),
      })

      expect(response.statusCode).toBe(200)

      const fresh = response.json().recoveryCodes

      expect(fresh).toHaveLength(10)
      expect(fresh).not.toContain(recoveryCodes[0])

      expect(store.mails.at(-1)?.subject).toBe('Novos códigos de recuperação na Lynko')

      const disable = await post('/disable', headers, {
        password: 'right-pass',
        recoveryCode: recoveryCodes[0],
      })

      expect(disable.statusCode).toBe(400)
    })

    it('returns 400 for a wrong code and 401 for a wrong password', async () => {
      const { headers, secret } = await enableTwoFactor()

      const wrongCode = await post('/recovery-codes', headers, {
        password: 'right-pass',
        code: codeFor(secret),
      })

      const wrongPassword = await post('/recovery-codes', headers, {
        password: 'wrong-pass',
        code: codeFor(secret, 30),
      })

      expect(wrongCode.statusCode).toBe(400)
      expect(wrongPassword.statusCode).toBe(401)
    })

    it('returns 400 when two-factor is not enabled', async () => {
      const { headers } = await signInWithPassword()

      const response = await post('/recovery-codes', headers, {
        password: 'right-pass',
        code: '123456',
      })

      expect(response.statusCode).toBe(400)
    })
  })

  describe('disable', () => {
    it('disables with the password and an app code and clears everything', async () => {
      const { user, headers, secret } = await enableTwoFactor()

      const response = await post('/disable', headers, {
        password: 'right-pass',
        code: codeFor(secret, 30),
      })

      expect(response.statusCode).toBe(204)

      expect(user).toMatchObject({
        totpSecret: null,
        totpPendingSecret: null,
        totpEnabledAt: null,
        totpLastStep: null,
      })

      expect(store.recoveryCodes).toHaveLength(0)
      expect(store.mails.at(-1)?.subject).toBe('Login em duas etapas desativado na Lynko')
    })

    it('disables with a recovery code', async () => {
      const { user, headers, recoveryCodes } = await enableTwoFactor()

      const response = await post('/disable', headers, {
        password: 'right-pass',
        recoveryCode: recoveryCodes[3],
      })

      expect(response.statusCode).toBe(204)
      expect(user.totpEnabledAt).toBeNull()
    })

    it('keeps it enabled for a wrong password or a used code', async () => {
      const { user, headers, secret } = await enableTwoFactor()

      const wrongPassword = await post('/disable', headers, {
        password: 'wrong-pass',
        code: codeFor(secret, 30),
      })

      const usedCode = await post('/disable', headers, {
        password: 'right-pass',
        code: codeFor(secret),
      })

      expect(wrongPassword.statusCode).toBe(401)
      expect(usedCode.statusCode).toBe(400)
      expect(user.totpEnabledAt).toBeInstanceOf(Date)
    })

    it('returns 400 when sending both an app code and a recovery code', async () => {
      const { headers, secret, recoveryCodes } = await enableTwoFactor()

      const response = await post('/disable', headers, {
        password: 'right-pass',
        code: codeFor(secret, 30),
        recoveryCode: recoveryCodes[0],
      })

      expect(response.statusCode).toBe(400)
    })
  })
})
