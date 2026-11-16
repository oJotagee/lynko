import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

export const domainSchema = z.object({
  hostname: z
    .string()
    .trim()
    .min(1, 'Digite o domínio')
    .max(253, 'Use até 253 caracteres')
    .regex(
      /^(https?:\/\/)?[a-z0-9.-]+\.[a-z]{2,}(:\d+)?\/?$/i,
      'Digite um domínio como seunome.com',
    ),
})

export type DomainSchemaData = z.infer<typeof domainSchema>

export function useDomainSchema() {
  return useForm<DomainSchemaData>({
    resolver: zodResolver(domainSchema),
    defaultValues: { hostname: '' },
  })
}
