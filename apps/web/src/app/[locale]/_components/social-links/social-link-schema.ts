import { z } from 'zod'

export const SOCIAL_PLATFORMS = [
  'instagram',
  'facebook',
  'tiktok',
  'youtube',
  'linkedin',
  'github',
  'whatsapp',
  'x',
  'spotify',
  'pinterest',
] as const

export const MAX_SOCIAL_LINKS = SOCIAL_PLATFORMS.length

export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number]

const PHONE_PATTERN = /^\+?[0-9 ()-]{8,20}$/

const httpUrl = z.url({ protocol: /^https?$/ })

export const socialLinkSchema = z
  .object({
    platform: z.enum(SOCIAL_PLATFORMS),
    url: z.string().trim().min(1, 'Informe a URL').max(2048, 'Use até 2048 caracteres'),
    isActive: z.boolean(),
  })
  .superRefine((link, ctx) => {
    if (link.platform === 'whatsapp' && PHONE_PATTERN.test(link.url)) return

    if (!httpUrl.safeParse(link.url).success) {
      ctx.addIssue({
        code: 'custom',
        path: ['url'],
        message:
          link.platform === 'whatsapp'
            ? 'Informe um número com DDI ou uma URL com http ou https'
            : 'Informe uma URL com http ou https',
      })
    }
  })

export const socialLinksSchema = z
  .array(socialLinkSchema)
  .max(MAX_SOCIAL_LINKS, 'Use até 10 redes sociais')
  .refine(
    (links) => new Set(links.map((link) => link.platform)).size === links.length,
    'Use apenas um link por rede social',
  )

export type SocialLinkData = z.infer<typeof socialLinkSchema>

export function getSocialLinkUrlError(link: SocialLinkData): string | undefined {
  const result = socialLinkSchema.safeParse(link)

  return result.success ? undefined : result.error.issues[0]?.message
}

export function getSocialLinkHref(link: SocialLinkData): string | null {
  if (getSocialLinkUrlError(link)) return null

  const url = link.url.trim()

  return link.platform === 'whatsapp' && PHONE_PATTERN.test(url)
    ? `https://wa.me/${url.replace(/\D/g, '')}`
    : url
}

export function formatWhatsappInput(value: string): string {
  if (/[a-z/:.]/i.test(value)) return value

  const hasPlus = value.trim().startsWith('+')

  const digits = value.replace(/\D/g, '')

  if (!digits) return hasPlus ? '+' : ''

  const full = hasPlus || digits.startsWith('55') ? digits : `55${digits}`

  if (!full.startsWith('55')) return `+${full.slice(0, 15)}`

  const ddd = full.slice(2, 4)

  const number = full.slice(4, 13)

  if (!number) return ddd ? `+55 (${ddd}` : '+55'

  const split = number.length > 8 ? 5 : 4

  const local = number.length > split ? `${number.slice(0, split)}-${number.slice(split)}` : number

  return `+55 (${ddd}) ${local}`
}
