import { z } from 'zod'

const email = z.string().trim().toLowerCase().pipe(z.email().max(50))

const password = z.string().min(8).max(72)

export const registerBody = z.object({
  name: z.string().trim().min(2).max(100),
  email,
  password,
})

export const loginBody = z.object({
  email,
  password: z.string().min(1).max(72),
})

export const accessTokenResponse = z.object({
  accessToken: z.string(),
})

export type RegisterBody = z.infer<typeof registerBody>
export type LoginBody = z.infer<typeof loginBody>
