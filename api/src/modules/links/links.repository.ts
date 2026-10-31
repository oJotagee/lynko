import { and, asc, eq, sql } from 'drizzle-orm'

import { linkSchema } from '../../db/schema'
import { db } from '../../db'

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

  async create(data: NewLink) {
    const [link] = await db.insert(linkSchema).values(data).returning()

    return link
  },

  async update(id: string, pageId: string, changes: LinkChanges) {
    const [link] = await db
      .update(linkSchema)
      .set(changes)
      .where(and(eq(linkSchema.id, id), eq(linkSchema.pageId, pageId)))
      .returning()

    return link
  },

  async delete(id: string, pageId: string) {
    const [link] = await db
      .delete(linkSchema)
      .where(and(eq(linkSchema.id, id), eq(linkSchema.pageId, pageId)))
      .returning({ id: linkSchema.id })

    return link
  },

  async reorder(pageId: string, linkIds: string[]) {
    const cases = linkIds.map(
      (id, position) => sql`WHEN ${linkSchema.id} = ${id}::uuid THEN ${position}::integer`,
    )

    await db
      .update(linkSchema)
      .set({ position: sql`CASE ${sql.join(cases, sql` `)} ELSE ${linkSchema.position} END` })
      .where(eq(linkSchema.pageId, pageId))
  },
}
