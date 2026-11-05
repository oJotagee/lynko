import { describe, expect, it } from 'bun:test'

import { defaultAppearance } from '@/app/[locale]/_components/appearance-schema'
import {
  buttonHoverClasses,
  buttonRadius,
  getBackgroundStyle,
  getButtonStyle,
} from '@/app/[locale]/_components/page-view/appearance-style'

describe('getBackgroundStyle', () => {
  it('uses the solid color', () => {
    const style = getBackgroundStyle({
      ...defaultAppearance,
      background: { type: 'solid', color: '#e9ff9e' },
    })

    expect(style).toEqual({ background: '#e9ff9e' })
  })

  it('builds a linear gradient from the two colors', () => {
    const style = getBackgroundStyle({
      ...defaultAppearance,
      background: { type: 'gradient', gradientFrom: '#000000', gradientTo: '#ffffff' },
    })

    expect(style.backgroundImage).toBe('linear-gradient(160deg, #000000, #ffffff)')
  })

  it('falls back to white when a solid background has no color', () => {
    const style = getBackgroundStyle({ ...defaultAppearance, background: { type: 'solid' } })

    expect(style).toEqual({ background: '#ffffff' })
  })

  it('uses the image with a dark overlay when the url is http or https', () => {
    const style = getBackgroundStyle(
      { ...defaultAppearance, background: { type: 'image', imageMediaId: 'id' } },
      'https://cdn.example.com/bg.webp',
    )

    expect(style.backgroundImage).toContain('url("https://cdn.example.com/bg.webp")')
    expect(style.backgroundImage).toContain('rgba(0, 0, 0, 0.45)')
    expect(style.backgroundSize).toBe('cover')
  })

  it.each(['javascript:alert(1)', 'data:text/html,x', '", 1)'])(
    'ignores the unsafe image url %s',
    (url) => {
      const style = getBackgroundStyle(
        { ...defaultAppearance, background: { type: 'image', color: '#123456' } },
        url,
      )

      expect(style).toEqual({ background: '#123456' })
    },
  )
})

describe('getButtonStyle', () => {
  const buttons = defaultAppearance.buttons

  it('keeps the button colors on hover by default', () => {
    expect(getButtonStyle(buttons)).toMatchObject({
      background: buttons.backgroundColor,
      color: buttons.textColor,
      '--button-hover-bg': buttons.backgroundColor,
      '--button-hover-fg': buttons.textColor,
    })
  })

  it('swaps the colors on hover when the effect is invert', () => {
    expect(getButtonStyle({ ...buttons, hoverEffect: 'invert' })).toMatchObject({
      '--button-hover-bg': buttons.textColor,
      '--button-hover-fg': buttons.backgroundColor,
    })
  })

  it('uses the custom hover color for the background', () => {
    expect(
      getButtonStyle({ ...buttons, hoverEffect: 'invert', hoverColor: '#ff8d6b' }),
    ).toMatchObject({
      '--button-hover-bg': '#ff8d6b',
      '--button-hover-fg': buttons.backgroundColor,
    })
  })

  it('has no movement classes for invert and none', () => {
    expect(buttonHoverClasses.invert).toBe('')
    expect(buttonHoverClasses.none).toBe('')
    expect(buttonHoverClasses.lift).toContain('hover:-translate-y-0.5')

    expect(buttonHoverClasses.grow).toContain('hover:scale-[1.03]')
  })
})

describe('buttonRadius', () => {
  it('maps each shape to a radius', () => {
    expect(buttonRadius).toEqual({ square: 0, rounded: 10, pill: 24 })
  })
})
