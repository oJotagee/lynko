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
