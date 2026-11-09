import { describe, expect, test } from 'bun:test'

import { deleteAccountSchema } from '@/app/[locale]/(panel)/dashboard/settings/_components/delete-account-schema'

function messages(password: string) {
  const result = deleteAccountSchema.safeParse({ password })

  return result.success ? [] : result.error.issues.map((issue) => issue.message)
}

describe('delete account schema', () => {
  test('accepts a password', () => {
    expect(messages('right-password')).toEqual([])
  })

  test('requires the password', () => {
    expect(messages('')).toEqual(['Informe sua senha para confirmar'])
  })

  test('rejects a password longer than the API accepts', () => {
    expect(messages('a'.repeat(73))).toEqual(['A senha deve ter no máximo 72 caracteres'])
  })
})
