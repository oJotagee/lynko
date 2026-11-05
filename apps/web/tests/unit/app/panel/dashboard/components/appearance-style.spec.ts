import { describe, expect, it } from 'bun:test'

import { defaultAppearance } from '@/app/[locale]/_components/appearance-schema'
import {
  buttonRadius,
  getBackgroundStyle,
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

describe('buttonRadius', () => {
  it('maps each shape to a radius', () => {
    expect(buttonRadius).toEqual({ square: 0, rounded: 10, pill: 24 })
  })
})
