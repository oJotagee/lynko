import { z } from 'zod'

export const linkSchema = z.object({
  title: z.string().trim().min(1, 'Informe o título do link').max(80, 'Use até 80 caracteres'),
  url: z
    .string()
    .trim()
    .pipe(
      z
        .url({ protocol: /^https?$/, error: 'Informe uma URL com http ou https' })
        .max(2048, 'Use até 2048 caracteres'),
    ),
})

export type LinkSchemaData = z.infer<typeof linkSchema>
