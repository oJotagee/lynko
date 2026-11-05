import { z } from 'zod'

export type MediaType = 'avatar' | 'background'

export const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp']

const MB = 1024 * 1024

export const imageMaxMegabytes: Record<MediaType, number> = { avatar: 5, background: 10 }

export function imageFileSchema(type: MediaType) {
  return z
    .instanceof(File)
    .refine((file) => IMAGE_MIME_TYPES.includes(file.type), 'Use uma imagem JPG, PNG ou WebP')
    .refine(
      (file) => file.size > 0 && file.size <= imageMaxMegabytes[type] * MB,
      `Use uma imagem de até ${imageMaxMegabytes[type]} MB`,
    )
}
