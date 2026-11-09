import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

export interface ForgotPasswordSchemaData {
  email: string
}

export function useForgotPasswordSchema() {
  const t = useTranslations('Auth.Validation')

  return useForm<ForgotPasswordSchemaData>({
    resolver: zodResolver(
      z.object({
        email: z
          .string()
          .trim()
          .min(1, t('emailRequired'))
          .pipe(z.email(t('emailInvalid'))),
      }),
    ),
    defaultValues: { email: '' },
  })
}
