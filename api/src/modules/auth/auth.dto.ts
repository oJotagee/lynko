import { z } from 'zod'
import { twoFactorCode, twoFactorRecoveryCode } from '../two-factor/two-factor.dto'

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

const linkToken = z.string().min(1).max(200)

export const verifyEmailBody = z.object({
  token: linkToken,
})

export const googleLoginBody = z.object({
  idToken: z.string().min(1).max(4096),
})

export const confirmDeletionBody = z.object({
  token: linkToken,
})

export const forgotPasswordBody = z.object({
  email,
})

export const resetPasswordBody = z.object({
  token: linkToken,
  password,
})

export const resendVerificationResponse = z.object({
  retryAfter: z.number(),
})

export type RegisterBody = z.infer<typeof registerBody>

export type LoginBody = z.infer<typeof loginBody>

export type GoogleLoginBody = z.infer<typeof googleLoginBody>

export type ForgotPasswordBody = z.infer<typeof forgotPasswordBody>

export type ResetPasswordBody = z.infer<typeof resetPasswordBody>

export const loginResponse = z.union([
  accessTokenResponse,
  z.object({ twoFactorRequired: z.literal(true), challengeToken: z.string() }),
])

const challengeToken = z.string().min(1).max(1024)

export const twoFactorLoginBody = z.union([
  z.object({ challengeToken, code: twoFactorCode }).strict(),
  z.object({ challengeToken, recoveryCode: twoFactorRecoveryCode }).strict(),
])

export type TwoFactorLoginBody = z.infer<typeof twoFactorLoginBody>
