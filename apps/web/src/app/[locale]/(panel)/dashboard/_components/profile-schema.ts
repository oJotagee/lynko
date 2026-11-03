import { z } from 'zod'

const color = z.string().regex(/^#[0-9a-f]{6}$/i, 'Use uma cor hexadecimal válida')

export const themeSchema = z.object({
  background: color,
  foreground: color,
  button: color,
  buttonText: color,
  buttonStyle: z.enum(['filled', 'outline']),
  radius: z.enum(['none', 'small', 'medium', 'full']),
  theme: z.string(),
  accent: color,
})

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
  published: z.boolean(),
})

export type ProfileSchemaData = z.infer<typeof profileSchema>
