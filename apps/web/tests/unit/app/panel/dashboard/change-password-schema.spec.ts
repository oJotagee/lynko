import { describe, expect, test } from 'bun:test'

import { changePasswordSchema } from '@/app/[locale]/(panel)/dashboard/settings/_components/change-password-schema'

function messages(input: {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}) {
  const result = changePasswordSchema.safeParse(input)

  return result.success ? [] : result.error.issues.map((issue) => issue.message)
}

describe('change password schema', () => {
  test('accepts a valid change', () => {
    expect(
      messages({
        currentPassword: 'old-password',
        newPassword: 'new-password-1',
        confirmPassword: 'new-password-1',
      }),
    ).toEqual([])
  })

  test('rejects a confirmation that does not match', () => {
    expect(
      messages({
        currentPassword: 'old-password',
        newPassword: 'new-password-1',
        confirmPassword: 'new-password-2',
      }),
    ).toEqual(['As senhas não coincidem'])
  })

  test('rejects a short new password', () => {
    expect(
      messages({ currentPassword: 'old-password', newPassword: 'short', confirmPassword: 'short' }),
    ).toEqual(['A nova senha deve ter pelo menos 8 caracteres'])
  })

  test('rejects empty fields', () => {
    expect(messages({ currentPassword: '', newPassword: '', confirmPassword: '' })).toEqual(
      expect.arrayContaining([
        'Informe a senha atual',
        'Informe a nova senha',
        'Confirme a nova senha',
      ]),
    )
  })

  test('rejects passwords longer than the API accepts', () => {
    const long = 'a'.repeat(73)

    expect(messages({ currentPassword: long, newPassword: long, confirmPassword: long })).toEqual([
      'A senha deve ter no máximo 72 caracteres',
      'A senha deve ter no máximo 72 caracteres',
    ])
  })
})
