import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, 'Informe a senha atual')
      .max(72, 'A senha deve ter no máximo 72 caracteres'),
    newPassword: z
      .string()
      .min(1, 'Informe a nova senha')
      .min(8, 'A nova senha deve ter pelo menos 8 caracteres')
      .max(72, 'A senha deve ter no máximo 72 caracteres'),
    confirmPassword: z.string().min(1, 'Confirme a nova senha'),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'As senhas não coincidem',
  })

export type ChangePasswordSchemaData = z.infer<typeof changePasswordSchema>

export function useChangePasswordSchema() {
  return useForm<ChangePasswordSchemaData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  })
}
