import { and, eq, sql } from 'drizzle-orm'
import { db } from '../../db'
import { pageSchema } from '../../db/schema'

type PageChanges = Partial<Omit<NewPage, 'id' | 'userId' | 'revision' | 'createdAt' | 'updatedAt'>>

type NewPage = typeof pageSchema.$inferInsert

const nextRevision = sql<number>`nextval('pages_revision_seq')`

export const pageRevisionColumns = {
  id: pageSchema.id,
  username: pageSchema.username,
  revision: pageSchema.revision,
  isPublished: pageSchema.isPublished,
}

export function bumpRevision(pageId: string) {
  return db
    .update(pageSchema)
    .set({ revision: nextRevision })
    .where(eq(pageSchema.id, pageId))
    .returning(pageRevisionColumns)
}

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

  async findPublishedById(id: string) {
    const [page] = await db
      .select()
      .from(pageSchema)
      .where(and(eq(pageSchema.id, id), eq(pageSchema.isPublished, true)))
      .limit(1)

    return page
  },

  async findRefByUsername(username: string) {
    const [page] = await db
      .select({
        id: pageSchema.id,
        revision: pageSchema.revision,
        isPublished: pageSchema.isPublished,
      })
      .from(pageSchema)
      .where(eq(pageSchema.username, username))
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
      .set({ ...changes, revision: nextRevision })
      .where(eq(pageSchema.userId, userId))
      .returning()

    return page
  },

  async deleteByUserId(userId: string) {
    const [page] = await db
      .delete(pageSchema)
      .where(eq(pageSchema.userId, userId))
      .returning(pageRevisionColumns)

    return page
  },
}
