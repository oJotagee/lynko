import { z } from 'zod'

const password = z.string().min(1).max(72)

export const twoFactorCode = z.string().regex(/^\d{6}$/)

export const twoFactorRecoveryCode = z
  .string()
  .trim()
  .regex(/^[a-z2-7]{5}-?[a-z2-7]{5}$/i)

export const twoFactorStatusResponse = z.object({
  enabled: z.boolean(),
  recoveryCodesLeft: z.number().int(),
})

export const twoFactorSetupBody = z.object({ password })

export const twoFactorSetupResponse = z.object({
  secret: z.string(),
  otpauthUrl: z.string(),
})

export const twoFactorEnableBody = z.object({ code: twoFactorCode })

export const recoveryCodesResponse = z.object({ recoveryCodes: z.array(z.string()) })

export const twoFactorDisableBody = z.union([
  z.object({ password, code: twoFactorCode }).strict(),
  z.object({ password, recoveryCode: twoFactorRecoveryCode }).strict(),
])

export const regenerateRecoveryCodesBody = z.object({ password, code: twoFactorCode })

export type SecondFactor = { code: string } | { recoveryCode: string }

export type TwoFactorDisableBody = z.infer<typeof twoFactorDisableBody>

export type RegenerateRecoveryCodesBody = z.infer<typeof regenerateRecoveryCodesBody>
