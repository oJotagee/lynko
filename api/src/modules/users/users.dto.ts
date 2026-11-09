import { z } from 'zod'

export const userResponse = z.object({
  id: z.uuid(),
  name: z.string(),
  email: z.email(),
  hasPassword: z.boolean(),
  hasGoogle: z.boolean(),
  emailVerified: z.boolean(),
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
