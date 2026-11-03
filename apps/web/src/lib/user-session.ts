import { z } from 'zod'

export const userSessionSchema = z.object({
  id: z.uuid(),
  name: z.string().trim().min(1),
  email: z.email(),
})

export type UserSession = z.infer<typeof userSessionSchema>
