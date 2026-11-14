import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string(),
  password: z.string(),
})

export type LoginSchemaData = z.infer<typeof loginSchema>

export function useLoginSchema() {
  const t = useTranslations('Auth.Validation')

  return useForm<LoginSchemaData>({
    resolver: zodResolver(
      z.object({
        email: z
          .string()
          .trim()
          .min(1, t('emailRequired'))
          .pipe(z.email(t('emailInvalid'))),
        password: z.string().min(1, t('passwordRequired')).min(8, t('passwordMin')),
      }),
    ),
    defaultValues: { email: '', password: '' },
  })
}

const twoFactorLoginSchema = z.discriminatedUnion('method', [
  z.object({ method: z.literal('code'), code: z.string(), recoveryCode: z.string() }),
  z.object({ method: z.literal('recovery'), code: z.string(), recoveryCode: z.string() }),
])

export type TwoFactorLoginSchemaData = z.infer<typeof twoFactorLoginSchema>

export function useTwoFactorLoginSchema() {
  const t = useTranslations('Auth.TwoFactor')

  return useForm<TwoFactorLoginSchemaData>({
    resolver: zodResolver(
      z.discriminatedUnion('method', [
        z.object({
          method: z.literal('code'),
          code: z.string().regex(/^\d{6}$/, t('codeInvalid')),
          recoveryCode: z.string(),
        }),
        z.object({
          method: z.literal('recovery'),
          code: z.string(),
          recoveryCode: z
            .string()
            .trim()
            .regex(/^[a-z2-7]{5}-?[a-z2-7]{5}$/i, t('recoveryInvalid')),
        }),
      ]),
    ),
    defaultValues: { method: 'code', code: '', recoveryCode: '' },
  })
}
