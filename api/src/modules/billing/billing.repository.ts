import { and, eq, exists, isNull, ne, or, type SQL, sql } from 'drizzle-orm'
import { db } from '../../db'
import { billingEventSchema, subscriptionSchema } from '../../db/schema'
import type { BillingCycle } from './billing.dto'

export type Subscription = typeof subscriptionSchema.$inferSelect

export interface BillingEvent {
  id: string
  type: string
}

const changed = {
  userId: subscriptionSchema.userId,
  status: subscriptionSchema.status,
  cycle: subscriptionSchema.cycle,
  currentPeriodEnd: subscriptionSchema.currentPeriodEnd,
}

const nextPeriodEnd = sql`greatest(coalesce(${subscriptionSchema.currentPeriodEnd}, now()), now()) + case when ${subscriptionSchema.cycle} = 'annually' then interval '1 year' else interval '1 month' end`

function insertedEvent(event: BillingEvent) {
  return db
    .$with('inserted')
    .as(
      db
        .insert(billingEventSchema)
        .values(event)
        .onConflictDoNothing()
        .returning({ id: billingEventSchema.id }),
    )
}

async function updateOnce(
  event: BillingEvent,
  values: Parameters<ReturnType<typeof db.update<typeof subscriptionSchema>>['set']>[0],
  where: SQL | undefined,
) {
  const inserted = insertedEvent(event)

  const [row] = await db
    .with(inserted)
    .update(subscriptionSchema)
    .set(values)
    .where(and(where, exists(db.select({ id: inserted.id }).from(inserted))))
    .returning(changed)

  return row
}

export const billingRepository = {
  async findByUserId(userId: string) {
    const [subscription] = await db
      .select()
      .from(subscriptionSchema)
      .where(eq(subscriptionSchema.userId, userId))
      .limit(1)

    return subscription
  },

  async findById(id: string) {
    const [subscription] = await db
      .select()
      .from(subscriptionSchema)
      .where(eq(subscriptionSchema.id, id))
      .limit(1)

    return subscription
  },

  async upsertPending(userId: string, cycle: BillingCycle, providerCustomerId: string) {
    const [subscription] = await db
      .insert(subscriptionSchema)
      .values({ userId, cycle, status: 'pending', providerCustomerId })
      .onConflictDoUpdate({
        target: subscriptionSchema.userId,
        set: { cycle, status: 'pending', providerCustomerId, checkoutId: null },
      })
      .returning({ id: subscriptionSchema.id })

    return subscription
  },

  async saveCheckout(id: string, checkoutId: string) {
    await db.update(subscriptionSchema).set({ checkoutId }).where(eq(subscriptionSchema.id, id))
  },

  async activate(event: BillingEvent, id: string, providerSubscriptionId: string) {
    return updateOnce(
      event,
      {
        providerSubscriptionId,
        status: 'active',
        cancelledAt: null,
        currentPeriodEnd: nextPeriodEnd,
      },
      and(
        eq(subscriptionSchema.id, id),
        or(
          ne(subscriptionSchema.status, 'active'),
          isNull(subscriptionSchema.providerSubscriptionId),
          eq(subscriptionSchema.providerSubscriptionId, providerSubscriptionId),
        ),
      ),
    )
  },

  async renew(event: BillingEvent, providerSubscriptionId: string) {
    return updateOnce(
      event,
      { status: 'active', currentPeriodEnd: nextPeriodEnd },
      and(
        eq(subscriptionSchema.providerSubscriptionId, providerSubscriptionId),
        ne(subscriptionSchema.status, 'cancelled'),
      ),
    )
  },

  async cancelByProvider(event: BillingEvent, providerSubscriptionId: string) {
    return updateOnce(
      event,
      { status: 'cancelled', cancelledAt: sql`now()` },
      and(
        eq(subscriptionSchema.providerSubscriptionId, providerSubscriptionId),
        ne(subscriptionSchema.status, 'cancelled'),
      ),
    )
  },

  async hasEvent(id: string) {
    const [event] = await db
      .select({ id: billingEventSchema.id })
      .from(billingEventSchema)
      .where(eq(billingEventSchema.id, id))
      .limit(1)

    return Boolean(event)
  },

  async recordEvent(event: BillingEvent) {
    const inserted = await db
      .insert(billingEventSchema)
      .values(event)
      .onConflictDoNothing()
      .returning({ id: billingEventSchema.id })

    return inserted.length > 0
  },

  async markCancelled(userId: string) {
    const [row] = await db
      .update(subscriptionSchema)
      .set({ status: 'cancelled', cancelledAt: sql`now()` })
      .where(and(eq(subscriptionSchema.userId, userId), eq(subscriptionSchema.status, 'active')))
      .returning(changed)

    return row
  },
}
