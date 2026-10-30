import { and, eq } from 'drizzle-orm'

import { pageSchema } from '../../db/schema'
import { db } from '../../db'

type PageChanges = Partial<Omit<NewPage, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
type NewPage = typeof pageSchema.$inferInsert

export const pagesRepository = {
  async findByUserId(userId: string) {
    const [page] = await db.select().from(pageSchema).where(eq(pageSchema.userId, userId)).limit(1)

    return page
  },

  async findByUsername(username: string) {
    const [page] = await db
      .select()
      .from(pageSchema)
      .where(eq(pageSchema.username, username))
      .limit(1)

    return page
  },

  async findPublishedByUsername(username: string) {
    const [page] = await db
      .select()
      .from(pageSchema)
      .where(and(eq(pageSchema.username, username), eq(pageSchema.isPublished, true)))
      .limit(1)

    return page
  },

  async create(data: NewPage) {
    const [page] = await db.insert(pageSchema).values(data).returning()

    return page
  },

  async updateByUserId(userId: string, changes: PageChanges) {
    const [page] = await db
      .update(pageSchema)
      .set(changes)
      .where(eq(pageSchema.userId, userId))
      .returning()

    return page
  },

  async deleteByUserId(userId: string) {
    const [page] = await db
      .delete(pageSchema)
      .where(eq(pageSchema.userId, userId))
      .returning({ id: pageSchema.id })

    return page
  },
}
