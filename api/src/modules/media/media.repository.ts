import { and, count, eq, inArray } from 'drizzle-orm'
import { db } from '../../db'
import { mediaSchema } from '../../db/schema'
import type { MediaType } from './media.dto'

type NewMedia = typeof mediaSchema.$inferInsert

export const mediaRepository = {
  async findById(id: string, pageId: string) {
    const [media] = await db
      .select()
      .from(mediaSchema)
      .where(and(eq(mediaSchema.id, id), eq(mediaSchema.pageId, pageId)))
      .limit(1)

    return media
  },

  async findReadyOwned(id: string, pageId: string, type: MediaType) {
    const [media] = await db
      .select()
      .from(mediaSchema)
      .where(
        and(
          eq(mediaSchema.id, id),
          eq(mediaSchema.pageId, pageId),
          eq(mediaSchema.type, type),
          eq(mediaSchema.status, 'ready'),
        ),
      )
      .limit(1)

    return media
  },

  async findReadyByIds(ids: string[]) {
    if (ids.length === 0) return []

    return db
      .select()
      .from(mediaSchema)
      .where(and(inArray(mediaSchema.id, ids), eq(mediaSchema.status, 'ready')))
  },

  async countPending(pageId: string) {
    const [result] = await db
      .select({ total: count() })
      .from(mediaSchema)
      .where(and(eq(mediaSchema.pageId, pageId), eq(mediaSchema.status, 'pending')))

    return result?.total ?? 0
  },

  async create(data: NewMedia) {
    const [media] = await db.insert(mediaSchema).values(data).returning()

    return media
  },

  async markReady(id: string, pageId: string, changes: { key: string; mimeType: string }) {
    const [media] = await db
      .update(mediaSchema)
      .set({ ...changes, status: 'ready' })
      .where(
        and(
          eq(mediaSchema.id, id),
          eq(mediaSchema.pageId, pageId),
          eq(mediaSchema.status, 'pending'),
        ),
      )
      .returning()

    return media
  },

  async markFailed(id: string, pageId: string) {
    await db
      .update(mediaSchema)
      .set({ status: 'failed' })
      .where(
        and(
          eq(mediaSchema.id, id),
          eq(mediaSchema.pageId, pageId),
          eq(mediaSchema.status, 'pending'),
        ),
      )
  },

  async delete(id: string, pageId: string) {
    const [media] = await db
      .delete(mediaSchema)
      .where(and(eq(mediaSchema.id, id), eq(mediaSchema.pageId, pageId)))
      .returning({ id: mediaSchema.id })

    return media
  },
}
