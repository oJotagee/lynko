import { z } from 'zod'

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Use uma cor hexadecimal válida')

export const FONT_FAMILIES = ['inter', 'roboto', 'playfair', 'space-grotesk'] as const

export const appearanceSchema = z.object({
  version: z.literal(1),
  theme: z.enum(['minimal', 'dark', 'gradient', 'custom']),
  background: z
    .object({
      type: z.enum(['solid', 'gradient', 'image']),
      color: hexColor.optional(),
      gradientFrom: hexColor.optional(),
      gradientTo: hexColor.optional(),
      imageMediaId: z.uuid().optional(),
    })
    .superRefine((background, ctx) => {
      if (background.type === 'solid' && !background.color) {
        ctx.addIssue({ code: 'custom', path: ['color'], message: 'Escolha a cor de fundo' })
      }

      if (background.type === 'gradient') {
        for (const field of ['gradientFrom', 'gradientTo'] as const) {
          if (!background[field]) {
            ctx.addIssue({ code: 'custom', path: [field], message: 'Escolha as duas cores' })
          }
        }
      }

      if (background.type === 'image' && !background.imageMediaId) {
        ctx.addIssue({ code: 'custom', path: ['imageMediaId'], message: 'Escolha uma imagem' })
      }
    }),
  typography: z.object({ fontFamily: z.enum(FONT_FAMILIES), textColor: hexColor }),
  buttons: z.object({
    shape: z.enum(['square', 'rounded', 'pill']),
    backgroundColor: hexColor,
    textColor: hexColor,
  }),
  socialIcons: z.object({ size: z.enum(['sm', 'md', 'lg']), color: hexColor }),
})

export type PageAppearance = z.infer<typeof appearanceSchema>

export type FontFamily = PageAppearance['typography']['fontFamily']

export const defaultAppearance: PageAppearance = {
  version: 1,
  theme: 'minimal',
  background: { type: 'solid', color: '#ffffff' },
  typography: { fontFamily: 'inter', textColor: '#111111' },
  buttons: { shape: 'rounded', backgroundColor: '#111111', textColor: '#ffffff' },
  socialIcons: { size: 'md', color: '#111111' },
}

export const appearanceThemes = [
  { id: 'minimal', name: 'Minimal', appearance: defaultAppearance },
  {
    id: 'dark',
    name: 'Dark',
    appearance: {
      ...defaultAppearance,
      theme: 'dark',
      background: { type: 'solid', color: '#171716' },
      typography: { fontFamily: 'inter', textColor: '#f7f6f1' },
      buttons: { shape: 'rounded', backgroundColor: '#31312e', textColor: '#f7f6f1' },
      socialIcons: { size: 'md', color: '#f7f6f1' },
    },
  },
  {
    id: 'gradient',
    name: 'Gradient',
    appearance: {
      ...defaultAppearance,
      theme: 'gradient',
      background: { type: 'gradient', gradientFrom: '#9b8cff', gradientTo: '#ffd7ca' },
      typography: { fontFamily: 'inter', textColor: '#171716' },
      buttons: { shape: 'rounded', backgroundColor: '#ffffff', textColor: '#171716' },
      socialIcons: { size: 'md', color: '#171716' },
    },
  },
] as const satisfies readonly { id: string; name: string; appearance: PageAppearance }[]
