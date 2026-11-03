import { describe, expect, it } from 'bun:test'
import { randomUUID } from 'node:crypto'

import {
  createRefreshToken,
  hashSecret,
  parseRefreshToken,
  secretMatchesHash,
} from '../../../src/shared/token'

describe('refresh token', () => {
  it('creates a token that parses back to the session and matches its hash', () => {
    const sessionId = randomUUID()
    const { token, secretHash } = createRefreshToken(sessionId)

    const parsed = parseRefreshToken(token)

    expect(parsed?.sessionId).toBe(sessionId)
    expect(secretMatchesHash(parsed?.secret ?? '', secretHash)).toBe(true)
  })

  it('never stores the secret itself', () => {
    const { token, secretHash } = createRefreshToken(randomUUID())

    expect(token).not.toContain(secretHash)
    expect(secretHash).toBe(hashSecret(token.split('.')[1] ?? ''))
  })

  it.each([
    ['without a secret', `${randomUUID()}.`],
    ['with extra segments', `${randomUUID()}.secret.extra`],
    ['with an invalid session id', 'not-a-uuid.secret'],
    ['empty', ''],
  ])('rejects a token %s', (_case, token) => {
    expect(parseRefreshToken(token)).toBeNull()
  })

  it('does not match a different secret', () => {
    expect(secretMatchesHash('other-secret', hashSecret('secret'))).toBe(false)
  })
})
