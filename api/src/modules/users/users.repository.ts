import { eq } from 'drizzle-orm'

import { db } from '../../db'
import { userSchema } from '../../db/schema'

export const publicUserColumns = {
  id: userSchema.id,
  name: userSchema.name,
  email: userSchema.email,
  createdAt: userSchema.createdAt,
  updatedAt: userSchema.updatedAt,
}

export const usersRepository = {
  async findById(id: string) {
    const [user] = await db
      .select(publicUserColumns)
      .from(userSchema)
      .where(eq(userSchema.id, id))
      .limit(1)

    return user
  },
}
