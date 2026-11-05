import { z } from 'zod'

const reserved = new Set([
  'admin',
  'api',
  'app',
  'auth',
  'dashboard',
  'docs',
  'health',
  'help',
  'login',
  'logout',
  'lynko',
  'me',
  'pages',
  'register',
  'settings',
  'signup',
  'support',
  'users',
])

export const profileSchema = z.object({
  name: z.string().trim().min(1, 'Informe o nome de exibição').max(80, 'Use até 80 caracteres'),
  email: z.email('Informe um e-mail válido'),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, 'Use ao menos 3 caracteres')
    .max(30, 'Use até 30 caracteres')
    .regex(/^[a-z0-9_]+$/, 'Use letras minúsculas, números ou sublinhado')
    .refine((value) => !reserved.has(value), 'Este nome de usuário é reservado'),
  bio: z.string().trim().max(160, 'Use até 160 caracteres'),
  image: z.union([
    z.literal(''),
    z.url({ protocol: /^https?$/, error: 'Informe uma URL com http ou https' }).max(2048),
  ]),
  avatarMediaId: z.uuid().nullable(),
  published: z.boolean(),
})

export type ProfileSchemaData = z.infer<typeof profileSchema>

export function normalizeUsernameInput(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '')
    .slice(0, 30)
}
