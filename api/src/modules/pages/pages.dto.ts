import { z } from 'zod'

import { defaultPageTheme, pageThemeSchema } from './pages.theme'

const RESERVED_USERNAMES = new Set([
  'admin',
  'api',
  'app',
  'auth',
  'dashboard',
  'docs',
  'health',
  'help',
  'login',
  'logout',
  'lynko',
  'me',
  'pages',
  'register',
  'settings',
  'signup',
  'support',
  'users',
])

const username = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(
    z
      .string()
      .min(3)
      .max(30)
      .regex(/^[a-z0-9_]+$/, 'Only lowercase letters, numbers and underscore')
      .refine((value) => !RESERVED_USERNAMES.has(value), 'This username is reserved'),
  )

const title = z.string().trim().min(1).max(80)
const bio = z.string().trim().max(160)
const avatarUrl = z.url({ protocol: /^https?$/ }).max(2048)

export const createPageBody = z.object({
  username,
  title,
  bio: bio.optional(),
  avatarUrl: avatarUrl.optional(),
  theme: pageThemeSchema.default(defaultPageTheme),
})

export const updatePageBody = z
  .object({
    username,
    title,
    bio: bio.nullable(),
    avatarUrl: avatarUrl.nullable(),
    theme: pageThemeSchema.partial(),
    isPublished: z.boolean(),
  })
  .partial()
  .refine((body) => Object.keys(body).length > 0, 'Send at least one field to update')

export const usernameParams = z.object({
  username: z.string().trim().toLowerCase().max(30),
})

export const pageResponse = z.object({
  id: z.uuid(),
  username: z.string(),
  title: z.string(),
  bio: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  theme: pageThemeSchema,
  isPublished: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export const publicPageResponse = pageResponse.pick({
  username: true,
  title: true,
  bio: true,
  avatarUrl: true,
  theme: true,
})

export type CreatePageBody = z.infer<typeof createPageBody>
export type UpdatePageBody = z.infer<typeof updatePageBody>
