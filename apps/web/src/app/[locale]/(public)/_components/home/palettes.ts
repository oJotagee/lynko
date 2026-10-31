export const PALETTES = [
  { id: 'lime', name: 'Lime', swatch: '#b7f34a' },
  { id: 'violet', name: 'Bloom', swatch: '#9b8cff' },
  { id: 'peach', name: 'Peach', swatch: '#ff8d6b' },
  { id: 'ink', name: 'Ink', swatch: '#171716' },
] as const

export type PaletteId = (typeof PALETTES)[number]['id']
