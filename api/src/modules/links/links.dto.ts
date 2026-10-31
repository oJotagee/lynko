import { z } from 'zod'

export const MAX_LINKS_PER_PAGE = 100

const title = z.string().trim().min(1).max(80)
const url = z
  .string()
  .trim()
  .pipe(z.url({ protocol: /^https?$/ }).max(2048))

export const createLinkBody = z.object({
  title,
  url,
  isActive: z.boolean().optional(),
})

export const updateLinkBody = z
  .object({
    title,
    url,
    isActive: z.boolean(),
  })
  .partial()
  .refine((body) => Object.keys(body).length > 0, 'Send at least one field to update')

export const reorderLinksBody = z.object({
  linkIds: z.array(z.uuid()).min(1).max(MAX_LINKS_PER_PAGE),
})

export const linkParams = z.object({
  id: z.uuid(),
})

export const linkResponse = z.object({
  id: z.uuid(),
  title: z.string(),
  url: z.string(),
  position: z.number().int(),
  isActive: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export const publicLinkResponse = linkResponse.pick({
  id: true,
  title: true,
  url: true,
})

export type CreateLinkBody = z.infer<typeof createLinkBody>
export type UpdateLinkBody = z.infer<typeof updateLinkBody>
