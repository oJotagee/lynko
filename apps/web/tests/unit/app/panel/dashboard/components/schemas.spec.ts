import { describe, expect, it } from 'bun:test'

import {
  defaultTheme,
  themeToAppearance,
} from '@/app/[locale]/(panel)/dashboard/_components/dashboard-data'
import { profileSchema, themeSchema } from '@/app/[locale]/(panel)/dashboard/_components/schemas'

describe('profileSchema', () => {
  const validInput = {
    name: 'Maria Silva',
    email: 'maria@example.com',
    username: 'maria_silva',
    bio: 'Designer',
    image: '',
    published: false,
  }

  it('accepts a valid profile', () => {
    expect(profileSchema.safeParse(validInput).success).toBe(true)
  })

  it('lowercases the username', () => {
    expect(profileSchema.parse({ ...validInput, username: 'Maria_Silva' }).username).toBe(
      'maria_silva',
    )
  })

  it.each([
    ['a reserved username', { username: 'dashboard' }],
    ['a username with hyphen', { username: 'maria-silva' }],
    ['a short username', { username: 'ab' }],
    ['an empty name', { name: '   ' }],
    ['a bio over 160 characters', { bio: 'x'.repeat(161) }],
    ['a photo that is not http', { image: 'data:image/png;base64,abc' }],
  ])('rejects %s', (_case, change) => {
    expect(profileSchema.safeParse({ ...validInput, ...change }).success).toBe(false)
  })

  it('shows the reserved username message', () => {
    const result = profileSchema.safeParse({ ...validInput, username: 'admin' })

    expect(result.error?.issues[0]?.message).toBe('Este nome de usuário é reservado')
  })
})

describe('themeSchema', () => {
  const appearance = themeToAppearance(defaultTheme)

  it('accepts the default appearance', () => {
    expect(themeSchema.parse(appearance)).toEqual(appearance)
  })

  it.each([
    ['a color name', { background: 'red' }],
    ['a short hex color', { button: '#fff' }],
    ['an unknown radius', { radius: 'round' }],
  ])('rejects %s', (_case, change) => {
    expect(themeSchema.safeParse({ ...appearance, ...change }).success).toBe(false)
  })
})
