import { describe, expect, it } from 'bun:test'

import { hashPassword, verifyPassword } from '../../../src/shared/password'

describe('password', () => {
  it('verifies the password against its hash', async () => {
    const hash = await hashPassword('correct-password')

    expect(hash).not.toBe('correct-password')
    expect(await verifyPassword('correct-password', hash)).toBe(true)
    expect(await verifyPassword('wrong-password', hash)).toBe(false)
  })

  it('returns false when there is no hash (unknown user)', async () => {
    expect(await verifyPassword('any-password', undefined)).toBe(false)
  })
})
