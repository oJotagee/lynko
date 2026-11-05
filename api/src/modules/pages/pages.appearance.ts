import { z } from 'zod'

import { hexColor, type PageTheme } from './pages.theme'

export const FONT_FAMILIES = ['inter', 'roboto', 'playfair', 'space-grotesk'] as const

export const BUTTON_HOVER_EFFECTS = ['lift', 'grow', 'fade', 'invert', 'none'] as const

const pageBackgroundSchema = z
  .object({
    type: z.enum(['solid', 'gradient', 'image']),
    color: hexColor.optional(),
    gradientFrom: hexColor.optional(),
    gradientTo: hexColor.optional(),
    imageMediaId: z.uuid().optional(),
  })
  .superRefine((background, ctx) => {
    if (background.type === 'solid' && !background.color) {
      ctx.addIssue({ code: 'custom', path: ['color'], message: 'A solid background needs a color' })
    }

    if (background.type === 'gradient') {
      for (const field of ['gradientFrom', 'gradientTo'] as const) {
        if (!background[field]) {
          ctx.addIssue({
            code: 'custom',
            path: [field],
            message: 'A gradient background needs gradientFrom and gradientTo',
          })
        }
      }
    }

    if (background.type === 'image' && !background.imageMediaId) {
      ctx.addIssue({
        code: 'custom',
        path: ['imageMediaId'],
        message: 'An image background needs imageMediaId',
      })
    }
  })

export const pageAppearanceSchema = z.object({
  version: z.literal(1),
  theme: z.enum(['minimal', 'dark', 'gradient', 'custom']),
  background: pageBackgroundSchema,
  typography: z.object({ fontFamily: z.enum(FONT_FAMILIES), textColor: hexColor }),
  buttons: z.object({
    shape: z.enum(['square', 'rounded', 'pill']),
    backgroundColor: hexColor,
    textColor: hexColor,
    hoverEffect: z.enum(BUTTON_HOVER_EFFECTS).default('lift'),
    hoverColor: hexColor.optional(),
  }),
  socialIcons: z.object({ size: z.enum(['sm', 'md', 'lg']), color: hexColor }),
})

export type PageAppearance = z.infer<typeof pageAppearanceSchema>

export const defaultPageAppearance: PageAppearance = {
  version: 1,
  theme: 'minimal',
  background: { type: 'solid', color: '#ffffff' },
  typography: { fontFamily: 'inter', textColor: '#111111' },
  buttons: {
    shape: 'rounded',
    backgroundColor: '#111111',
    textColor: '#ffffff',
    hoverEffect: 'lift',
  },
  socialIcons: { size: 'md', color: '#111111' },
}

const buttonShapeByRadius = {
  none: 'square',
  small: 'rounded',
  medium: 'rounded',
  full: 'pill',
} as const

export function appearanceFromTheme(theme: PageTheme): PageAppearance {
  return {
    version: 1,
    theme: 'custom',
    background: { type: 'solid', color: theme.backgroundColor },
    typography: { fontFamily: 'inter', textColor: theme.textColor },
    buttons: {
      shape: buttonShapeByRadius[theme.buttonRadius],
      backgroundColor: theme.buttonColor,
      textColor: theme.buttonTextColor,
      hoverEffect: 'lift',
    },
    socialIcons: { size: 'md', color: theme.textColor },
  }
}

export function resolveAppearance(page: {
  appearance: PageAppearance | null
  theme: PageTheme
}): PageAppearance {
  return page.appearance
    ? pageAppearanceSchema.parse(page.appearance)
    : appearanceFromTheme(page.theme)
}

export function getBackgroundMediaId(appearance: PageAppearance | null) {
  return appearance?.background.type === 'image'
    ? (appearance.background.imageMediaId ?? null)
    : null
}
