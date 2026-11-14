import { z } from 'zod'

export const userResponse = z.object({
  id: z.uuid(),
  name: z.string(),
  email: z.email(),
  hasPassword: z.boolean(),
  hasGoogle: z.boolean(),
  emailVerified: z.boolean(),
  twoFactorEnabled: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export const changePasswordBody = z.object({
  currentPassword: z.string().min(1).max(72),
  newPassword: z.string().min(8).max(72),
})

export const deleteAccountBody = z.object({
  password: z.string().min(1).max(72).optional(),
})

export type ChangePasswordBody = z.infer<typeof changePasswordBody>

export type DeleteAccountBody = z.infer<typeof deleteAccountBody>

export const sessionResponse = z.object({
  id: z.uuid(),
  browser: z.string().nullable(),
  os: z.string().nullable(),
  createdAt: z.date(),
  lastActiveAt: z.date(),
  current: z.boolean(),
})

export const sessionParams = z.object({ id: z.uuid() })

export const revokedSessionsResponse = z.object({ revoked: z.number().int() })
