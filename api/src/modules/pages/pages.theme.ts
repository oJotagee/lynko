import { z } from 'zod'

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Expected a hex color like #1a2b3c')

export const pageThemeSchema = z.object({
  backgroundColor: hexColor,
  textColor: hexColor,
  buttonColor: hexColor,
  buttonTextColor: hexColor,
  buttonStyle: z.enum(['filled', 'outline']),
  buttonRadius: z.enum(['none', 'small', 'medium', 'full']),
})

export type PageTheme = z.infer<typeof pageThemeSchema>

export const defaultPageTheme: PageTheme = {
  backgroundColor: '#ffffff',
  textColor: '#111111',
  buttonColor: '#111111',
  buttonTextColor: '#ffffff',
  buttonStyle: 'filled',
  buttonRadius: 'medium',
}
