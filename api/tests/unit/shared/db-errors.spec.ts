import { describe, expect, it } from 'bun:test'

import { getUniqueViolation } from '../../../src/shared/db-errors'

describe('getUniqueViolation', () => {
  it('returns the constraint of a unique violation', () => {
    const error = new Error('insert failed', {
      cause: { code: '23505', constraint: 'pages_username_unique' },
    })

    expect(getUniqueViolation(error)).toBe('pages_username_unique')
  })

  it('returns "unknown" when the driver does not report the constraint', () => {
    expect(getUniqueViolation(new Error('insert failed', { cause: { code: '23505' } }))).toBe(
      'unknown',
    )
  })

  it('returns null for other errors', () => {
    expect(getUniqueViolation(new Error('timeout', { cause: { code: '57014' } }))).toBeNull()
    expect(getUniqueViolation('not an error')).toBeNull()
  })
})
