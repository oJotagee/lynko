import { and, asc, eq, inArray, isNotNull, isNull, lt, or, sql } from 'drizzle-orm'
import { db } from '../../db'
import { customDomainSchema, pageSchema } from '../../db/schema'

export type CustomDomain = typeof customDomainSchema.$inferSelect

export type NewCustomDomain = Pick<
  typeof customDomainSchema.$inferInsert,
  'userId' | 'hostname' | 'kind' | 'verificationToken'
>

export type CustomDomainChanges = Partial<
  Pick<CustomDomain, 'status' | 'lastError' | 'ownerVerifiedAt' | 'lastCheckedAt'>
>

export const domainsRepository = {
  async findByUserId(userId: string) {
    const [domain] = await db
      .select()
      .from(customDomainSchema)
      .where(eq(customDomainSchema.userId, userId))
      .limit(1)

    return domain
  },

  async findVerifiedByHostname(hostname: string) {
    const [domain] = await db
      .select()
      .from(customDomainSchema)
      .where(
        and(
          eq(customDomainSchema.hostname, hostname),
          isNotNull(customDomainSchema.ownerVerifiedAt),
        ),
      )
      .limit(1)

    return domain
  },

  async findActiveOwner(hostname: string) {
    const [owner] = await db
      .select({ userId: customDomainSchema.userId, username: pageSchema.username })
      .from(customDomainSchema)
      .innerJoin(pageSchema, eq(pageSchema.userId, customDomainSchema.userId))
      .where(
        and(
          eq(customDomainSchema.hostname, hostname),
          isNotNull(customDomainSchema.ownerVerifiedAt),
          eq(customDomainSchema.status, 'active'),
        ),
      )
      .limit(1)

    return owner
  },

  async findActiveHostname(userId: string) {
    const [domain] = await db
      .select({ hostname: customDomainSchema.hostname })
      .from(customDomainSchema)
      .where(and(eq(customDomainSchema.userId, userId), eq(customDomainSchema.status, 'active')))
      .limit(1)

    return domain?.hostname ?? null
  },

  async findDue(pendingBefore: Date, activeBefore: Date, limit: number) {
    return db
      .select()
      .from(customDomainSchema)
      .where(
        or(
          and(
            inArray(customDomainSchema.status, ['pending_owner', 'pending_dns']),
            or(
              isNull(customDomainSchema.lastCheckedAt),
              lt(customDomainSchema.lastCheckedAt, pendingBefore),
            ),
          ),
          and(
            eq(customDomainSchema.status, 'active'),
            lt(customDomainSchema.lastCheckedAt, activeBefore),
          ),
        ),
      )
      .orderBy(sql`${customDomainSchema.lastCheckedAt} asc nulls first`, asc(customDomainSchema.id))
      .limit(limit)
  },

  async create(values: NewCustomDomain) {
    const [domain] = await db
      .insert(customDomainSchema)
      .values({ ...values, status: 'pending_owner' })
      .returning()

    return domain
  },

  async update(id: string, changes: CustomDomainChanges) {
    const [domain] = await db
      .update(customDomainSchema)
      .set(changes)
      .where(eq(customDomainSchema.id, id))
      .returning()

    return domain
  },

  async activate(id: string, checkedAt: Date) {
    const values = { status: 'active' as const, lastError: null, lastCheckedAt: checkedAt }

    const [first] = await db
      .update(customDomainSchema)
      .set({ ...values, activatedAt: checkedAt })
      .where(and(eq(customDomainSchema.id, id), isNull(customDomainSchema.activatedAt)))
      .returning()

    if (first) return { domain: first, firstActivation: true }

    return { domain: await domainsRepository.update(id, values), firstActivation: false }
  },

  async deleteByUserId(userId: string) {
    const [domain] = await db
      .delete(customDomainSchema)
      .where(eq(customDomainSchema.userId, userId))
      .returning()

    return domain
  },
}
