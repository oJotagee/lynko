import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

const registerSchema = z.object({
  name: z.string(),
  email: z.string(),
  password: z.string(),
})

export type RegisterSchemaData = z.infer<typeof registerSchema>

export function useRegisterSchema() {
  const t = useTranslations('Auth.Validation')

  return useForm<RegisterSchemaData>({
    resolver: zodResolver(
      z.object({
        name: z.string().trim().min(2, t('nameRequired')),
        email: z
          .string()
          .trim()
          .min(1, t('emailRequired'))
          .pipe(z.email(t('emailInvalid'))),
        password: z.string().min(1, t('passwordRequired')).min(8, t('passwordMin')),
      }),
    ),
    defaultValues: { name: '', email: '', password: '' },
  })
}
