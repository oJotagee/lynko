import { z } from 'zod'

import { env } from '../../config/env'

export const MEDIA_TYPES = ['avatar', 'background'] as const

export const MEDIA_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const

export type MediaType = (typeof MEDIA_TYPES)[number]

export const mediaMaxBytes: Record<MediaType, number> = {
  avatar: env.MEDIA_AVATAR_MAX_BYTES,
  background: env.MEDIA_BACKGROUND_MAX_BYTES,
}

export const presignMediaBody = z
  .object({
    type: z.enum(MEDIA_TYPES),
    fileName: z.string().trim().min(1).max(255),
    contentType: z.enum(MEDIA_MIME_TYPES),
    size: z.number().int().positive(),
  })
  .superRefine((body, ctx) => {
    if (body.size > mediaMaxBytes[body.type]) {
      ctx.addIssue({
        code: 'custom',
        path: ['size'],
        message: `File must be at most ${mediaMaxBytes[body.type]} bytes`,
      })
    }
  })

export const mediaParams = z.object({
  id: z.uuid(),
})

export const presignMediaResponse = z.object({
  mediaId: z.uuid(),
  uploadUrl: z.url(),
  expiresIn: z.number().int(),
})

export const mediaResponse = z.object({
  id: z.uuid(),
  type: z.enum(MEDIA_TYPES),
  status: z.enum(['pending', 'ready', 'failed']),
  mimeType: z.string(),
  size: z.number().int(),
  url: z.url().nullable(),
})

export type PresignMediaBody = z.infer<typeof presignMediaBody>
