import { afterEach, beforeEach, describe, expect, it, mock, setSystemTime } from 'bun:test'

import { authTokens } from '../../../../src/modules/auth/auth.tokens'
import { BadRequestError } from '../../../../src/shared/errors'
import { useInMemoryRepositories } from '../../support/memory-repositories'

describe('authTokens', () => {
  let store: ReturnType<typeof useInMemoryRepositories>

  const userId = 'a26d7946-6249-4f68-95e6-5cb612ccf538'

  beforeEach(() => {
    store = useInMemoryRepositories()
  })

  afterEach(() => {
    mock.restore()

    setSystemTime()
  })

  it('issues a token and consumes it for the owner', async () => {
    const token = await authTokens.issue(userId, 'password_reset')

    await expect(authTokens.consume('password_reset', token)).resolves.toBe(userId)
  })

  it('stores only the hash of the secret', async () => {
    const token = await authTokens.issue(userId, 'password_reset')

    const secret = token.split('.')[1] as string

    expect(store.authTokens[0]?.tokenHash).not.toContain(secret)
  })

  it('rejects a second consumption of the same token', async () => {
    const token = await authTokens.issue(userId, 'password_reset')

    await authTokens.consume('password_reset', token)

    await expect(authTokens.consume('password_reset', token)).rejects.toBeInstanceOf(
      BadRequestError,
    )
  })

  it('rejects an expired token', async () => {
    const token = await authTokens.issue(userId, 'password_reset')

    setSystemTime(new Date(Date.now() + 31 * 60 * 1000))

    await expect(authTokens.consume('password_reset', token)).rejects.toBeInstanceOf(
      BadRequestError,
    )
  })

  it('keeps the token when the secret is wrong', async () => {
    const token = await authTokens.issue(userId, 'password_reset')

    const [id] = token.split('.')

    await expect(authTokens.consume('password_reset', `${id}.wrong`)).rejects.toBeInstanceOf(
      BadRequestError,
    )

    await expect(authTokens.consume('password_reset', token)).resolves.toBe(userId)
  })

  it('rejects a token of another type', async () => {
    const token = await authTokens.issue(userId, 'password_reset')

    await expect(authTokens.consume('email_verification', token)).rejects.toBeInstanceOf(
      BadRequestError,
    )
  })

  it('invalidates the previous token when issuing again', async () => {
    const first = await authTokens.issue(userId, 'password_reset')

    const second = await authTokens.issue(userId, 'password_reset')

    await expect(authTokens.consume('password_reset', first)).rejects.toBeInstanceOf(
      BadRequestError,
    )

    await expect(authTokens.consume('password_reset', second)).resolves.toBe(userId)

    expect(store.authTokens).toHaveLength(0)
  })

  it('keeps tokens of different types independent', async () => {
    await authTokens.issue(userId, 'password_reset')

    await authTokens.issue(userId, 'email_verification')

    expect(store.authTokens).toHaveLength(2)
  })

  it('rejects malformed tokens with the same error', async () => {
    for (const token of ['', 'abc', 'a.b.c', 'not-a-uuid.secret']) {
      await expect(authTokens.consume('password_reset', token)).rejects.toMatchObject({
        message: 'Invalid or expired token',
        statusCode: 400,
      })
    }
  })

  it('reports the seconds since the last issue', async () => {
    await expect(authTokens.secondsSinceLastIssue(userId, 'password_reset')).resolves.toBeNull()

    await authTokens.issue(userId, 'password_reset')

    setSystemTime(new Date(Date.now() + 45 * 1000))

    await expect(authTokens.secondsSinceLastIssue(userId, 'password_reset')).resolves.toBe(45)
  })
})
