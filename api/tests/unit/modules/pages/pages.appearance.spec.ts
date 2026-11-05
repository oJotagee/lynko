import { describe, expect, it } from 'bun:test'

import {
  appearanceFromTheme,
  defaultPageAppearance,
  pageAppearanceSchema,
  resolveAppearance,
} from '../../../../src/modules/pages/pages.appearance'
import { defaultPageTheme } from '../../../../src/modules/pages/pages.theme'

const mediaId = 'a26d7946-6249-4f68-95e6-5cb612ccf538'

describe('pageAppearanceSchema', () => {
  it('accepts the default appearance', () => {
    expect(pageAppearanceSchema.safeParse(defaultPageAppearance).success).toBe(true)
  })

  it('rejects an invalid color', () => {
    const result = pageAppearanceSchema.safeParse({
      ...defaultPageAppearance,
      typography: { fontFamily: 'inter', textColor: 'red' },
    })

    expect(result.success).toBe(false)
  })

  it('rejects a CSS-looking color', () => {
    const result = pageAppearanceSchema.safeParse({
      ...defaultPageAppearance,
      buttons: { ...defaultPageAppearance.buttons, backgroundColor: 'url(javascript:alert(1))' },
    })

    expect(result.success).toBe(false)
  })

  it('rejects a font outside the enum', () => {
    const result = pageAppearanceSchema.safeParse({
      ...defaultPageAppearance,
      typography: { fontFamily: 'comic-sans', textColor: '#111111' },
    })

    expect(result.success).toBe(false)
  })

  it('rejects an unknown version', () => {
    expect(pageAppearanceSchema.safeParse({ ...defaultPageAppearance, version: 2 }).success).toBe(
      false,
    )
  })

  it.each([
    ['solid without color', { type: 'solid' }],
    ['gradient without gradientTo', { type: 'gradient', gradientFrom: '#000000' }],
    ['gradient without gradientFrom', { type: 'gradient', gradientTo: '#000000' }],
    ['image without imageMediaId', { type: 'image' }],
    ['image with an invalid imageMediaId', { type: 'image', imageMediaId: 'not-a-uuid' }],
  ])('rejects a background: %s', (_case, background) => {
    const result = pageAppearanceSchema.safeParse({ ...defaultPageAppearance, background })

    expect(result.success).toBe(false)
  })

  it.each([
    ['solid', { type: 'solid', color: '#e9ff9e' }],
    ['gradient', { type: 'gradient', gradientFrom: '#000000', gradientTo: '#ffffff' }],
    ['image', { type: 'image', imageMediaId: mediaId }],
  ])('accepts a %s background', (_case, background) => {
    const result = pageAppearanceSchema.safeParse({ ...defaultPageAppearance, background })

    expect(result.success).toBe(true)
  })
})

describe('appearanceFromTheme', () => {
  it('maps the legacy theme to a custom appearance', () => {
    const appearance = appearanceFromTheme({
      ...defaultPageTheme,
      backgroundColor: '#e9ff9e',
      textColor: '#171716',
      buttonColor: '#9b8cff',
      buttonTextColor: '#ffffff',
    })

    expect(appearance).toMatchObject({
      version: 1,
      theme: 'custom',
      background: { type: 'solid', color: '#e9ff9e' },
      typography: { textColor: '#171716' },
      buttons: { backgroundColor: '#9b8cff', textColor: '#ffffff' },
    })

    expect(pageAppearanceSchema.safeParse(appearance).success).toBe(true)
  })

  it.each([
    ['none', 'square'],
    ['small', 'rounded'],
    ['medium', 'rounded'],
    ['full', 'pill'],
  ] as const)('maps buttonRadius %s to %s', (buttonRadius, shape) => {
    expect(appearanceFromTheme({ ...defaultPageTheme, buttonRadius }).buttons.shape).toBe(shape)
  })
})

describe('resolveAppearance', () => {
  it('returns the stored appearance when there is one', () => {
    const appearance = { ...defaultPageAppearance, theme: 'dark' as const }

    expect(resolveAppearance({ appearance, theme: defaultPageTheme })).toBe(appearance)
  })

  it('falls back to the legacy theme when appearance is null', () => {
    expect(resolveAppearance({ appearance: null, theme: defaultPageTheme })).toEqual(
      appearanceFromTheme(defaultPageTheme),
    )
  })
})
