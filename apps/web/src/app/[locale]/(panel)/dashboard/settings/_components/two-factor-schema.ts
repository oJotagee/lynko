import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

const password = z
  .string()
  .min(1, 'Informe sua senha')
  .max(72, 'A senha deve ter no máximo 72 caracteres')

const code = z.string().regex(/^\d{6}$/, 'Digite os 6 dígitos do app')

const recoveryCode = z
  .string()
  .trim()
  .regex(/^[a-z2-7]{5}-?[a-z2-7]{5}$/i, 'Digite um código de recuperação, como abcde-fghij')

export const twoFactorPasswordSchema = z.object({ password })

export const twoFactorCodeSchema = z.object({ code })

export const twoFactorConfirmSchema = z.object({ password, code })

export const twoFactorDisableSchema = z.discriminatedUnion('method', [
  z.object({ method: z.literal('code'), password, code, recoveryCode: z.string() }),
  z.object({ method: z.literal('recovery'), password, code: z.string(), recoveryCode }),
])

export type TwoFactorPasswordData = z.infer<typeof twoFactorPasswordSchema>

export type TwoFactorCodeData = z.infer<typeof twoFactorCodeSchema>

export type TwoFactorConfirmData = z.infer<typeof twoFactorConfirmSchema>

export type TwoFactorDisableData = z.infer<typeof twoFactorDisableSchema>

export function useTwoFactorPasswordSchema() {
  return useForm<TwoFactorPasswordData>({
    resolver: zodResolver(twoFactorPasswordSchema),
    defaultValues: { password: '' },
  })
}

export function useTwoFactorCodeSchema() {
  return useForm<TwoFactorCodeData>({
    resolver: zodResolver(twoFactorCodeSchema),
    defaultValues: { code: '' },
  })
}

export function useTwoFactorConfirmSchema() {
  return useForm<TwoFactorConfirmData>({
    resolver: zodResolver(twoFactorConfirmSchema),
    defaultValues: { password: '', code: '' },
  })
}

export function useTwoFactorDisableSchema() {
  return useForm<TwoFactorDisableData>({
    resolver: zodResolver(twoFactorDisableSchema),
    defaultValues: { method: 'code', password: '', code: '', recoveryCode: '' },
  })
}
