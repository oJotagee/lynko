import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

export const deleteAccountSchema = z.object({
  password: z
    .string()
    .min(1, 'Informe sua senha para confirmar')
    .max(72, 'A senha deve ter no máximo 72 caracteres'),
})

export type DeleteAccountSchemaData = z.infer<typeof deleteAccountSchema>

export function useDeleteAccountSchema() {
  return useForm<DeleteAccountSchemaData>({
    resolver: zodResolver(deleteAccountSchema),
    defaultValues: { password: '' },
  })
}
