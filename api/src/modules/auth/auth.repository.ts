import { and, eq, isNull } from 'drizzle-orm'

import { publicUserColumns } from '../users/users.repository'
import { sessionSchema, userSchema } from '../../db/schema'
import { db } from '../../db'

type NewSession = typeof sessionSchema.$inferInsert
type NewUser = typeof userSchema.$inferInsert

export const authRepository = {
  async findByEmailWithPassword(email: string) {
    const [user] = await db.select().from(userSchema).where(eq(userSchema.email, email)).limit(1)
    return user
  },

  async existsByEmail(email: string) {
    const [user] = await db
      .select({ id: userSchema.id })
      .from(userSchema)
      .where(eq(userSchema.email, email))
      .limit(1)
    return Boolean(user)
  },

  async create(data: NewUser) {
    const [user] = await db.insert(userSchema).values(data).returning(publicUserColumns)

    return user
  },

  async createSession(data: NewSession) {
    await db.insert(sessionSchema).values(data)
  },

  async findSessionById(id: string) {
    const [session] = await db.select().from(sessionSchema).where(eq(sessionSchema.id, id)).limit(1)

    return session
  },

  async rotateSessionToken(id: string, refreshTokenHash: string, expiresAt: Date) {
    await db
      .update(sessionSchema)
      .set({ refreshTokenHash, expiresAt })
      .where(and(eq(sessionSchema.id, id), isNull(sessionSchema.revokedAt)))
  },

  async revokeSession(id: string) {
    await db
      .update(sessionSchema)
      .set({ revokedAt: new Date() })
      .where(and(eq(sessionSchema.id, id), isNull(sessionSchema.revokedAt)))
  },
}
