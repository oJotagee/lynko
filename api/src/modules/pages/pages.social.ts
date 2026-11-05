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

export const MAX_SOCIAL_LINKS = 10

const PHONE_PATTERN = /^\+?[0-9 ()-]{8,20}$/

const httpUrl = z.url({ protocol: /^https?$/ }).max(2048)

export const socialPlatformSchema = z.enum(SOCIAL_PLATFORMS)

export const socialLinkSchema = z
  .object({
    platform: socialPlatformSchema,
    url: z.string().trim().min(1).max(2048),
    isActive: z.boolean(),
  })
  .transform((link, ctx) => {
    if (link.platform === 'whatsapp' && PHONE_PATTERN.test(link.url)) {
      return { ...link, url: `https://wa.me/${link.url.replace(/\D/g, '')}` }
    }

    if (!httpUrl.safeParse(link.url).success) {
      ctx.addIssue({ code: 'custom', path: ['url'], message: 'Expected an http or https URL' })

      return z.NEVER
    }

    return link
  })

export const socialLinksSchema = z
  .array(socialLinkSchema)
  .max(MAX_SOCIAL_LINKS)
  .refine(
    (links) => new Set(links.map((link) => link.platform)).size === links.length,
    'Only one link per platform',
  )

export const socialLinkResponse = z.object({
  platform: socialPlatformSchema,
  url: z.string(),
  isActive: z.boolean(),
})

export type SocialPlatform = z.infer<typeof socialPlatformSchema>

export type SocialLink = z.infer<typeof socialLinkResponse>
