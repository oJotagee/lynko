import { and, asc, eq, sql } from 'drizzle-orm'
import { db } from '../../db'
import { linkSchema, pageSchema } from '../../db/schema'
import { bumpRevision } from '../pages/pages.repository'

type LinkChanges = Partial<Pick<typeof linkSchema.$inferInsert, 'title' | 'url' | 'isActive'>>

type NewLink = typeof linkSchema.$inferInsert

const pageOrder = [asc(linkSchema.position), asc(linkSchema.createdAt)]

export const linksRepository = {
  async findByPageId(pageId: string) {
    return db
      .select()
      .from(linkSchema)
      .where(eq(linkSchema.pageId, pageId))
      .orderBy(...pageOrder)
  },

  async findActiveByPageId(pageId: string) {
    return db
      .select()
      .from(linkSchema)
      .where(and(eq(linkSchema.pageId, pageId), eq(linkSchema.isActive, true)))
      .orderBy(...pageOrder)
  },

  async findPublicTarget(id: string) {
    const [target] = await db
      .select({ url: linkSchema.url, pageId: linkSchema.pageId })
      .from(linkSchema)
      .innerJoin(pageSchema, eq(pageSchema.id, linkSchema.pageId))
      .where(
        and(eq(linkSchema.id, id), eq(linkSchema.isActive, true), eq(pageSchema.isPublished, true)),
      )
      .limit(1)

    return target
  },

  async create(data: NewLink) {
    const [[link], [page]] = await db.batch([
      db.insert(linkSchema).values(data).returning(),
      bumpRevision(data.pageId),
    ])

    return { link, page }
  },

  async update(id: string, pageId: string, changes: LinkChanges) {
    const [[link], [page]] = await db.batch([
      db
        .update(linkSchema)
        .set(changes)
        .where(and(eq(linkSchema.id, id), eq(linkSchema.pageId, pageId)))
        .returning(),
      bumpRevision(pageId),
    ])

    return { link, page }
  },

  async delete(id: string, pageId: string) {
    const [[link], [page]] = await db.batch([
      db
        .delete(linkSchema)
        .where(and(eq(linkSchema.id, id), eq(linkSchema.pageId, pageId)))
        .returning({ id: linkSchema.id }),
      bumpRevision(pageId),
    ])

    return { link, page }
  },

  async reorder(pageId: string, linkIds: string[]) {
    const cases = linkIds.map(
      (id, position) => sql`WHEN ${linkSchema.id} = ${id}::uuid THEN ${position}::integer`,
    )

    const [, [page]] = await db.batch([
      db
        .update(linkSchema)
        .set({ position: sql`CASE ${sql.join(cases, sql` `)} ELSE ${linkSchema.position} END` })
        .where(eq(linkSchema.pageId, pageId)),
      bumpRevision(pageId),
    ])

    return page
  },
}
