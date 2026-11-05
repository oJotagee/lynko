import { describe, expect, it } from 'bun:test'

import {
  appearanceSchema,
  appearanceThemes,
  defaultAppearance,
} from '@/app/[locale]/_components/appearance-schema'
import { profileSchema } from '@/app/[locale]/(panel)/dashboard/_components/schemas'

describe('profileSchema', () => {
  const validInput = {
    name: 'Maria Silva',
    email: 'maria@example.com',
    username: 'maria_silva',
    bio: 'Designer',
    image: '',
    avatarMediaId: null,
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

describe('appearanceSchema', () => {
  it('accepts the default appearance and every theme preset', () => {
    expect(appearanceSchema.parse(defaultAppearance)).toEqual(defaultAppearance)

    for (const theme of appearanceThemes) {
      expect(appearanceSchema.safeParse(theme.appearance).success).toBe(true)
    }
  })

  it.each([
    ['a color name', { typography: { fontFamily: 'inter', textColor: 'red' } }],
    [
      'a short hex color',
      { buttons: { shape: 'rounded', backgroundColor: '#fff', textColor: '#000000' } },
    ],
    ['an unknown font', { typography: { fontFamily: 'comic-sans', textColor: '#111111' } }],
    [
      'an unknown shape',
      { buttons: { shape: 'blob', backgroundColor: '#111111', textColor: '#ffffff' } },
    ],
    ['a solid background without color', { background: { type: 'solid' } }],
    [
      'a gradient background without the second color',
      { background: { type: 'gradient', gradientFrom: '#000000' } },
    ],
    ['an image background without media', { background: { type: 'image' } }],
  ])('rejects %s', (_case, change) => {
    expect(appearanceSchema.safeParse({ ...defaultAppearance, ...change }).success).toBe(false)
  })
})
