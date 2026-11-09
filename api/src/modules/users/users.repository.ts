import { and, eq, exists, inArray, sql } from 'drizzle-orm'
import { db } from '../../db'
import {
  linkClicksDailySchema,
  mediaSchema,
  pageSchema,
  pageViewsDailySchema,
  socialClicksDailySchema,
  userSchema,
} from '../../db/schema'

export const publicUserColumns = {
  id: userSchema.id,
  name: userSchema.name,
  email: userSchema.email,
  hasPassword: sql<boolean>`${userSchema.passwordHash} is not null`,
  hasGoogle: sql<boolean>`${userSchema.googleId} is not null`,
  emailVerified: sql<boolean>`${userSchema.emailVerifiedAt} is not null`,
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

  async findWithPassword(id: string) {
    const [user] = await db.select().from(userSchema).where(eq(userSchema.id, id)).limit(1)

    return user
  },

  async deleteWithData(userId: string, expectedPasswordHash: string | null) {
    const credentialMatches = and(
      eq(userSchema.id, userId),
      sql`${userSchema.passwordHash} is not distinct from ${expectedPasswordHash}`,
    )

    const authorized = exists(
      db.select({ id: userSchema.id }).from(userSchema).where(credentialMatches),
    )

    const ownPages = db
      .select({ id: pageSchema.id })
      .from(pageSchema)
      .where(eq(pageSchema.userId, userId))

    const [locked, , , , , media, pages] = await db.batch([
      db.select({ id: userSchema.id }).from(userSchema).where(credentialMatches).for('update'),
      db
        .select({ id: pageSchema.id })
        .from(pageSchema)
        .where(and(eq(pageSchema.userId, userId), authorized))
        .for('update'),
      db
        .delete(pageViewsDailySchema)
        .where(and(inArray(pageViewsDailySchema.pageId, ownPages), authorized)),
      db
        .delete(linkClicksDailySchema)
        .where(and(inArray(linkClicksDailySchema.pageId, ownPages), authorized)),
      db
        .delete(socialClicksDailySchema)
        .where(and(inArray(socialClicksDailySchema.pageId, ownPages), authorized)),
      db
        .delete(mediaSchema)
        .where(and(inArray(mediaSchema.pageId, ownPages), authorized))
        .returning({ key: mediaSchema.key }),
      db
        .delete(pageSchema)
        .where(and(eq(pageSchema.userId, userId), authorized))
        .returning({ username: pageSchema.username, revision: pageSchema.revision }),
      db.delete(userSchema).where(credentialMatches),
    ])

    if (locked.length === 0) return undefined

    return { page: pages[0], mediaKeys: media.map((item) => item.key) }
  },
}
