import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'bun:test'
import { generateKeyPair, type JWTPayload, SignJWT } from 'jose'

import { env } from '../../../../src/config/env'
import { googleAuth } from '../../../../src/modules/auth/auth.google'
import { ServiceUnavailableError, UnauthorizedError } from '../../../../src/shared/errors'

describe('googleAuth.verifyIdToken', () => {
  const original = env.GOOGLE_CLIENT_ID

  const clientId = 'client-id.apps.googleusercontent.com'

  let privateKey: CryptoKey

  let getKey: () => Promise<CryptoKey>

  beforeAll(async () => {
    const pair = await generateKeyPair('RS256')

    privateKey = pair.privateKey

    getKey = async () => pair.publicKey
  })

  beforeEach(() => {
    env.GOOGLE_CLIENT_ID = clientId
  })

  afterEach(() => {
    env.GOOGLE_CLIENT_ID = original
  })

  function sign(
    claims: JWTPayload = {},
    options: { issuer?: string; audience?: string; expiresIn?: string; subject?: string } = {},
  ) {
    return new SignJWT({
      email: 'Maria@Example.com',
      email_verified: true,
      name: ' Maria Silva ',
      ...claims,
    })
      .setProtectedHeader({ alg: 'RS256' })
      .setSubject(options.subject ?? '1234567890')
      .setIssuer(options.issuer ?? 'https://accounts.google.com')
      .setAudience(options.audience ?? clientId)
      .setIssuedAt()
      .setExpirationTime(options.expiresIn ?? '5m')
      .sign(privateKey)
  }

  it('returns the normalized claims of a valid token', async () => {
    await expect(googleAuth.verifyIdToken(await sign(), getKey)).resolves.toEqual({
      googleId: '1234567890',
      email: 'maria@example.com',
      name: 'Maria Silva',
    })
  })

  it('accepts the issuer without the scheme', async () => {
    const token = await sign({}, { issuer: 'accounts.google.com' })

    await expect(googleAuth.verifyIdToken(token, getKey)).resolves.toMatchObject({
      googleId: '1234567890',
    })
  })

  it.each([
    ['an unverified e-mail', () => sign({ email_verified: false })],
    ['a missing e-mail verification', () => sign({ email_verified: undefined })],
    ['a missing e-mail', () => sign({ email: undefined })],
    ['the wrong audience', () => sign({}, { audience: 'other-client' })],
    ['the wrong issuer', () => sign({}, { issuer: 'https://evil.example.com' })],
    ['an expired token', () => sign({}, { expiresIn: '-1m' })],
    ['a subject that does not fit the column', () => sign({}, { subject: 'x'.repeat(33) })],
  ])('rejects %s', async (_, build) => {
    await expect(googleAuth.verifyIdToken(await build(), getKey)).rejects.toBeInstanceOf(
      UnauthorizedError,
    )
  })

  it('rejects a token signed by another key', async () => {
    const other = await generateKeyPair('RS256')

    const token = await new SignJWT({ email: 'a@example.com', email_verified: true })
      .setProtectedHeader({ alg: 'RS256' })
      .setSubject('1')
      .setIssuer('https://accounts.google.com')
      .setAudience(clientId)
      .setExpirationTime('5m')
      .sign(other.privateKey)

    await expect(googleAuth.verifyIdToken(token, getKey)).rejects.toBeInstanceOf(UnauthorizedError)
  })

  it('rejects a malformed token', async () => {
    await expect(googleAuth.verifyIdToken('not-a-jwt', getKey)).rejects.toBeInstanceOf(
      UnauthorizedError,
    )
  })

  it('answers 503 without GOOGLE_CLIENT_ID', async () => {
    env.GOOGLE_CLIENT_ID = undefined

    const error = await googleAuth.verifyIdToken(await sign(), getKey).catch((caught) => caught)

    expect(error).toBeInstanceOf(ServiceUnavailableError)

    expect(error.statusCode).toBe(503)
  })
})
