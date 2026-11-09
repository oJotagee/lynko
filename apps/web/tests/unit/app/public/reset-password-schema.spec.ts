import { describe, expect, test } from 'bun:test'

import { createResetPasswordSchema } from '@/app/[locale]/(public)/reset-password/_components/reset-password-schema'

const schema = createResetPasswordSchema((key) => key)

function messages(input: { password: string; confirmPassword: string }) {
  const result = schema.safeParse(input)

  return result.success ? [] : result.error.issues.map((issue) => issue.message)
}

describe('reset password schema', () => {
  test('accepts a valid password confirmed twice', () => {
    expect(messages({ password: 'new-password-1', confirmPassword: 'new-password-1' })).toEqual([])
  })

  test('rejects passwords that do not match', () => {
    expect(messages({ password: 'new-password-1', confirmPassword: 'new-password-2' })).toEqual([
      'passwordMismatch',
    ])
  })

  test('rejects a short password', () => {
    expect(messages({ password: 'short', confirmPassword: 'short' })).toEqual(['passwordMin'])
  })

  test('rejects a password longer than the API accepts', () => {
    const long = 'a'.repeat(73)

    expect(messages({ password: long, confirmPassword: long })).toEqual(['passwordMax'])
  })

  test('requires the password and its confirmation', () => {
    expect(messages({ password: '', confirmPassword: '' })).toContain('passwordRequired')

    expect(messages({ password: 'new-password-1', confirmPassword: '' })).toContain(
      'confirmRequired',
    )
  })
})
