const RENEWAL_GRACE_MS = 3 * 24 * 60 * 60 * 1000

export interface SubscriptionAccess {
  status: 'pending' | 'active' | 'cancelled'
  currentPeriodEnd: Date | null
}

export function proAccessUntil(subscription: SubscriptionAccess | null | undefined) {
  if (!subscription?.currentPeriodEnd) return null

  if (subscription.status === 'active') {
    return new Date(subscription.currentPeriodEnd.getTime() + RENEWAL_GRACE_MS)
  }

  return subscription.currentPeriodEnd
}

export function isPro(subscription: SubscriptionAccess | null | undefined, now = new Date()) {
  const until = proAccessUntil(subscription)

  return Boolean(until && until > now)
}

export const PRO_PLAN_REQUIRED = 'Pro plan required'
