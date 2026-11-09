import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

type ValidationKey =
  | 'passwordRequired'
  | 'passwordMin'
  | 'passwordMax'
  | 'confirmRequired'
  | 'passwordMismatch'

export interface ResetPasswordSchemaData {
  password: string
  confirmPassword: string
}

export function createResetPasswordSchema(t: (key: ValidationKey) => string) {
  return z
    .object({
      password: z
        .string()
        .min(1, t('passwordRequired'))
        .min(8, t('passwordMin'))
        .max(72, t('passwordMax')),
      confirmPassword: z.string().min(1, t('confirmRequired')),
    })
    .refine((values) => values.password === values.confirmPassword, {
      path: ['confirmPassword'],
      message: t('passwordMismatch'),
    })
}

export function useResetPasswordSchema() {
  const t = useTranslations('Auth.Validation')

  return useForm<ResetPasswordSchemaData>({
    resolver: zodResolver(createResetPasswordSchema(t)),
    defaultValues: { password: '', confirmPassword: '' },
  })
}
