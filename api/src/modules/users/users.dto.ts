import { z } from 'zod'

export const userResponse = z.object({
  id: z.uuid(),
  name: z.string(),
  email: z.email(),
  createdAt: z.date(),
  updatedAt: z.date(),
})
