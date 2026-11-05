import type { FontFamily } from '../appearance-schema'

export const fontFamilyStyles: Record<FontFamily, string> = {
  inter: 'var(--font-inter), sans-serif',
  roboto: 'var(--font-roboto), sans-serif',
  playfair: 'var(--font-playfair-display), serif',
  'space-grotesk': 'var(--font-space-grotesk), sans-serif',
}

export const fontFamilyNames: Record<FontFamily, string> = {
  inter: 'Inter',
  roboto: 'Roboto',
  playfair: 'Playfair',
  'space-grotesk': 'Space Grotesk',
}
