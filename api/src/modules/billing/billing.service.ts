import { z } from 'zod'
import { env } from '../../config/env'
import { ConflictError, NotFoundError, ServiceUnavailableError } from '../../shared/errors'
import { mailService } from '../mail/mail.service'
import { proActivatedMessage, proCancelledMessage } from '../mail/mail.templates'
import { toInvalidateEntry } from '../pages/pages.cache'
import { pagesRepository } from '../pages/pages.repository'
import { publicPageCache } from '../pages/pages.service'
import { usersRepository } from '../users/users.repository'
import { type AbacatePayProduct, abacatePay } from './abacatepay.client'
import { isPro, proAccessUntil } from './billing.access'
import type { BillingCycle } from './billing.dto'
import { billingRepository } from './billing.repository'
import type { WebhookEvent } from './billing.webhook'

const PLANS_CACHE_MS = 10 * 60 * 1000

let plansCache: { at: number; plans: Promise<[AbacatePayProduct, AbacatePayProduct]> } | null = null

function productIds(): Record<BillingCycle, string | undefined> {
  return {
    monthly: env.ABACATEPAY_PRO_MONTHLY_PRODUCT_ID,
    annually: env.ABACATEPAY_PRO_ANNUAL_PRODUCT_ID,
  }
}

function loadProducts(): Promise<[AbacatePayProduct, AbacatePayProduct]> {
  const { monthly, annually } = productIds()

  if (!monthly || !annually) throw new ServiceUnavailableError('Billing unavailable')

  return Promise.all([abacatePay.getProduct(monthly), abacatePay.getProduct(annually)])
}

export const billingService = {
  productIds,

  async getPlans(now = Date.now()) {
    if (!plansCache || now - plansCache.at > PLANS_CACHE_MS) {
      const plans = loadProducts()

      plansCache = { at: now, plans }

      plans.catch(() => {
        plansCache = null
      })
    }

    const [monthly, annually] = await plansCache.plans

    return [
      { cycle: 'monthly' as const, amount: monthly.price, currency: monthly.currency },
      { cycle: 'annually' as const, amount: annually.price, currency: annually.currency },
    ]
  },

  resetPlansCache() {
    plansCache = null
  },

  async getPlan(userId: string, now = new Date()) {
    const subscription = await billingRepository.findByUserId(userId)

    return isPro(subscription, now) ? ('pro' as const) : ('free' as const)
  },

  async getSubscription(userId: string, now = new Date()) {
    const subscription = await billingRepository.findByUserId(userId)

    return {
      plan: isPro(subscription, now) ? ('pro' as const) : ('free' as const),
      status: subscription?.status ?? null,
      cycle: subscription?.cycle ?? null,
      currentPeriodEnd: subscription?.currentPeriodEnd ?? null,
      accessUntil: proAccessUntil(subscription),
    }
  },
}

type ChangedSubscription = Awaited<ReturnType<typeof billingRepository.activate>>

async function notifyChange(
  changed: ChangedSubscription,
  message: (name: string, date: Date | null) => { subject: string; html: string; text: string },
  date: (subscription: NonNullable<ChangedSubscription>) => Date | null,
) {
  if (!changed) return

  const page = await pagesRepository.findByUserId(changed.userId)

  if (page) await publicPageCache.invalidate([toInvalidateEntry(page)])

  const user = await usersRepository.findById(changed.userId)

  if (user) void mailService.sendSafely({ to: user.email, ...message(user.name, date(changed)) })
}

const activatedOn = (subscription: NonNullable<ChangedSubscription>) =>
  subscription.currentPeriodEnd

const cancelledOn = (subscription: NonNullable<ChangedSubscription>) =>
  proAccessUntil({ ...subscription, status: 'cancelled' })

export const billingActions = {
  async startCheckout(userId: string, cycle: BillingCycle) {
    const productId = productIds()[cycle]

    if (!abacatePay.isConfigured() || !productId || !env.WEB_URL) {
      throw new ServiceUnavailableError('Billing unavailable')
    }

    const current = await billingRepository.findByUserId(userId)

    if (isPro(current) && current?.status === 'active') {
      throw new ConflictError('Subscription already active')
    }

    const user = await usersRepository.findById(userId)

    if (!user) throw new NotFoundError('User not found')

    const customerId =
      current?.providerCustomerId ??
      (await abacatePay.createCustomer({ email: user.email, name: user.name })).id

    const subscription = await billingRepository.upsertPending(userId, cycle, customerId)

    if (!subscription) throw new Error('Failed to save the subscription')

    const checkout = await abacatePay.createSubscriptionCheckout({
      productId,
      customerId,
      externalId: subscription.id,
      userId,
      completionUrl: `${env.WEB_URL}/dashboard/plans/success`,
      returnUrl: `${env.WEB_URL}/dashboard/plans`,
    })

    await billingRepository.saveCheckout(subscription.id, checkout.id)

    return { url: checkout.url }
  },

  async cancel(userId: string) {
    const current = await billingRepository.findByUserId(userId)

    if (current?.status !== 'active' || !current.providerSubscriptionId) {
      throw new NotFoundError('No active subscription')
    }

    await abacatePay.cancelSubscription(current.providerSubscriptionId)

    const changed = await billingRepository.markCancelled(userId)

    await notifyChange(changed, proCancelledMessage, cancelledOn)

    return { accessUntil: changed ? cancelledOn(changed) : null }
  },

  async cancelBeforeAccountDeletion(userId: string) {
    const current = await billingRepository.findByUserId(userId)

    if (current?.status !== 'active' || !current.providerSubscriptionId) return

    await abacatePay.cancelSubscription(current.providerSubscriptionId)

    await billingRepository.markCancelled(userId)
  },

  async handleWebhook(event: WebhookEvent) {
    const record = { id: event.id, type: event.event }

    const providerSubscriptionId = event.data.subscription?.id

    if (event.event === 'subscription.completed') {
      const rowId = event.data.checkout?.externalId

      if (!rowId || !providerSubscriptionId || !z.uuid().safeParse(rowId).success) {
        await billingRepository.recordEvent(record)

        return
      }

      const current = await billingRepository.findById(rowId)

      if (
        current?.status === 'active' &&
        current.providerSubscriptionId &&
        current.providerSubscriptionId !== providerSubscriptionId
      ) {
        if (await billingRepository.hasEvent(record.id)) return

        await abacatePay.cancelSubscription(providerSubscriptionId)

        await billingRepository.recordEvent(record)

        console.error('Duplicate subscription cancelled', providerSubscriptionId)

        return
      }

      const changed = await billingRepository.activate(record, rowId, providerSubscriptionId)

      await notifyChange(changed, proActivatedMessage, activatedOn)

      return
    }

    if (event.event === 'subscription.renewed' && providerSubscriptionId) {
      await billingRepository.renew(record, providerSubscriptionId)

      return
    }

    if (event.event === 'subscription.cancelled' && providerSubscriptionId) {
      const changed = await billingRepository.cancelByProvider(record, providerSubscriptionId)

      await notifyChange(changed, proCancelledMessage, cancelledOn)

      return
    }

    await billingRepository.recordEvent(record)
  },
}
