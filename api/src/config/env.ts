import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(8080),
  DATABASE_URL: z.url(),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('15m'),
  REFRESH_TOKEN_EXPIRES_IN_DAYS: z.coerce.number().int().positive().default(30),
  CORS_ORIGIN: z
    .string()
    .default('http://localhost:3000')
    .transform((value) => value.split(',').map((origin) => origin.trim()))
    .pipe(z.array(z.url())),
  AWS_REGION: z.string().min(1).optional(),
  S3_BUCKET: z.string().min(1).optional(),
  CDN_URL: z
    .url({ protocol: /^https?$/ })
    .transform((value) => value.replace(/\/+$/, ''))
    .optional(),
  MEDIA_AVATAR_MAX_BYTES: z.coerce.number().int().positive().default(5242880),
  MEDIA_BACKGROUND_MAX_BYTES: z.coerce.number().int().positive().default(10485760),
  MEDIA_MAX_PENDING_PER_PAGE: z.coerce.number().int().positive().default(5),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error('Invalid environment variables:')
  console.error(z.prettifyError(parsed.error))

  process.exit(1)
}

export const env = parsed.data
