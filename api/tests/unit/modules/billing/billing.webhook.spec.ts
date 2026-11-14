import { afterEach, beforeEach, describe, expect, it, mock, spyOn } from 'bun:test'
import { createHmac } from 'node:crypto'
import { env } from '../../../../src/config/env'
import { hashPassword } from '../../../../src/shared/password'
import { createTestApp, signIn } from '../../support/app'
import { buildSubscription } from '../../support/builders'
import { useInMemoryRepositories } from '../../support/memory-repositories'

const SECRET = 'webhook-secret-with-at-least-32-characters'

const PUBLIC_KEY = 'test-public-hmac-key'

const billingEnv = {
  ABACATEPAY_API_KEY: 'test-key',
  ABACATEPAY_WEBHOOK_SECRET: SECRET,
  ABACATEPAY_WEBHOOK_PUBLIC_KEY: PUBLIC_KEY,
  ABACATEPAY_PRO_MONTHLY_PRODUCT_ID: 'prod_monthly',
  ABACATEPAY_PRO_ANNUAL_PRODUCT_ID: 'prod_annual',
  WEB_URL: 'https://lynko.test',
}

const DAY = 24 * 60 * 60 * 1000

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

function mockAbacatePay(options: { cancelFails?: boolean } = {}) {
  return spyOn(globalThis, 'fetch').mockImplementation((async (input: string | URL) => {
    const path = new URL(String(input)).pathname

    if (path === '/v2/customers/create') {
      return jsonResponse({ data: { id: 'cust_1' }, success: true, error: null })
    }

    if (path === '/v2/subscriptions/create') {
      return jsonResponse({
        data: { id: 'bill_1', url: 'https://app.abacatepay.com/pay/bill_1' },
        success: true,
        error: null,
      })
    }

    if (path === '/v2/subscriptions/cancel' && !options.cancelFails) {
      return jsonResponse({
        data: { id: 'subs_1', status: 'CANCELLED' },
        success: true,
        error: null,
      })
    }

    return jsonResponse({ data: null, success: false, error: 'Failed' }, 500)
  }) as typeof fetch)
}

function signed(payload: unknown, overrides: { secret?: string; signature?: string } = {}) {
  const body = JSON.stringify(payload)

  return {
    body,
    headers: {
      'content-type': 'application/json',
      'x-webhook-secret': overrides.secret ?? SECRET,
      'x-webhook-signature':
        overrides.signature ?? createHmac('sha256', PUBLIC_KEY).update(body).digest('base64'),
    },
  }
}

function event(id: string, name: string, data: Record<string, unknown>) {
  return { id, event: name, apiVersion: 2, devMode: true, data }
}

describe('billing checkout, cancel and webhook', () => {
  let store: ReturnType<typeof useInMemoryRepositories>

  let app: Awaited<ReturnType<typeof createTestApp>>

  const original = { ...env }

  beforeEach(async () => {
    Object.assign(env, billingEnv)

    store = useInMemoryRepositories()

    app = await createTestApp()
  })

  afterEach(async () => {
    Object.assign(env, original)

    await app.close()

    mock.restore()
  })

  function sendWebhook(payload: unknown, overrides?: { secret?: string; signature?: string }) {
    const { body, headers } = signed(payload, overrides)

    return app.inject({
      method: 'POST',
      url: '/billing/webhooks/abacatepay',
      headers,
      payload: body,
    })
  }

  describe('POST /billing/checkout', () => {
    it('creates the customer, a pending subscription and returns the checkout url', async () => {
      const fetchSpy = mockAbacatePay()

      const { user, headers } = signIn(app, store)

      const response = await app.inject({
        method: 'POST',
        url: '/billing/checkout',
        headers,
        payload: { cycle: 'annually' },
      })

      expect(response.statusCode).toBe(200)
      expect(response.json()).toEqual({ url: 'https://app.abacatepay.com/pay/bill_1' })

      const subscription = store.subscriptions[0]

      expect(subscription).toMatchObject({
        userId: user.id,
        cycle: 'annually',
        status: 'pending',
        providerCustomerId: 'cust_1',
        checkoutId: 'bill_1',
      })

      const checkoutCall = fetchSpy.mock.calls.find(([url]) =>
        String(url).endsWith('/subscriptions/create'),
      )

      expect(JSON.parse(String(checkoutCall?.[1]?.body))).toMatchObject({
        items: [{ id: 'prod_annual', quantity: 1 }],
        customerId: 'cust_1',
        externalId: subscription?.id,
        completionUrl: 'https://lynko.test/dashboard/plans/success',
      })
    })

    it('reuses the customer of a previous subscription', async () => {
      const fetchSpy = mockAbacatePay()

      const { user, headers } = signIn(app, store)

      store.subscriptions.push(
        buildSubscription({
          userId: user.id,
          status: 'cancelled',
          providerCustomerId: 'cust_old',
          currentPeriodEnd: new Date(Date.now() - DAY),
        }),
      )

      await app.inject({
        method: 'POST',
        url: '/billing/checkout',
        headers,
        payload: { cycle: 'monthly' },
      })

      expect(fetchSpy.mock.calls.some(([url]) => String(url).endsWith('/customers/create'))).toBe(
        false,
      )
      expect(store.subscriptions).toHaveLength(1)
    })

    it('answers 409 for an active subscription', async () => {
      mockAbacatePay()

      const { user, headers } = signIn(app, store)

      store.subscriptions.push(buildSubscription({ userId: user.id }))

      const response = await app.inject({
        method: 'POST',
        url: '/billing/checkout',
        headers,
        payload: { cycle: 'monthly' },
      })

      expect(response.statusCode).toBe(409)
    })

    it('answers 503 without billing configured and 400 for an invalid cycle', async () => {
      const { headers } = signIn(app, store)

      const invalid = await app.inject({
        method: 'POST',
        url: '/billing/checkout',
        headers,
        payload: { cycle: 'weekly' },
      })

      Object.assign(env, { ABACATEPAY_API_KEY: undefined })

      const unavailable = await app.inject({
        method: 'POST',
        url: '/billing/checkout',
        headers,
        payload: { cycle: 'monthly' },
      })

      expect(invalid.statusCode).toBe(400)
      expect(unavailable.statusCode).toBe(503)
    })
  })

  describe('POST /billing/subscription/cancel', () => {
    it('cancels on AbacatePay and keeps Pro until the end of the period', async () => {
      const fetchSpy = mockAbacatePay()

      const { user, headers } = signIn(app, store)

      const periodEnd = new Date(Date.now() + 10 * DAY)

      store.subscriptions.push(
        buildSubscription({
          userId: user.id,
          providerSubscriptionId: 'subs_1',
          currentPeriodEnd: periodEnd,
        }),
      )

      const response = await app.inject({
        method: 'POST',
        url: '/billing/subscription/cancel',
        headers,
      })

      expect(response.statusCode).toBe(200)
      expect(response.json()).toEqual({ accessUntil: periodEnd.toISOString() })
      expect(store.subscriptions[0]?.status).toBe('cancelled')

      const cancelCall = fetchSpy.mock.calls.find(([url]) =>
        String(url).endsWith('/subscriptions/cancel'),
      )

      expect(JSON.parse(String(cancelCall?.[1]?.body))).toEqual({ id: 'subs_1' })

      const status = await app.inject({ method: 'GET', url: '/billing/subscription', headers })

      expect(status.json().plan).toBe('pro')

      expect(store.mails.at(-1)?.subject).toBe('Sua assinatura Pro da Lynko foi cancelada')
    })

    it('answers 404 without an active subscription', async () => {
      const { headers } = signIn(app, store)

      const response = await app.inject({
        method: 'POST',
        url: '/billing/subscription/cancel',
        headers,
      })

      expect(response.statusCode).toBe(404)
    })
  })

  describe('POST /billing/webhooks/abacatepay', () => {
    function pending(userId: string) {
      const subscription = buildSubscription({
        userId,
        status: 'pending',
        providerSubscriptionId: null,
        currentPeriodEnd: null,
      })

      store.subscriptions.push(subscription)

      return subscription
    }

    it('rejects a wrong secret, a wrong signature and a tampered body', async () => {
      const payload = event('log_1', 'subscription.renewed', { subscription: { id: 'subs_1' } })

      const wrongSecret = await sendWebhook(payload, { secret: 'not-the-secret' })

      const wrongSignature = await sendWebhook(payload, { signature: 'AAAA' })

      const { headers } = signed(payload)

      const tampered = await app.inject({
        method: 'POST',
        url: '/billing/webhooks/abacatepay',
        headers,
        payload: JSON.stringify({ ...payload, id: 'log_2' }),
      })

      expect(wrongSecret.statusCode).toBe(401)
      expect(wrongSignature.statusCode).toBe(401)
      expect(tampered.statusCode).toBe(401)
      expect(store.billingEvents.size).toBe(0)
    })

    it('accepts the secret in the query string', async () => {
      const { body, headers } = signed(event('log_q', 'checkout.completed', {}))

      const response = await app.inject({
        method: 'POST',
        url: `/billing/webhooks/abacatepay?webhookSecret=${SECRET}`,
        headers: { ...headers, 'x-webhook-secret': '' },
        payload: body,
      })

      expect(response.statusCode).toBe(200)
    })

    it('activates the subscription on subscription.completed and sends the e-mail', async () => {
      const { user } = signIn(app, store, { user: { name: 'Maria' } })

      const subscription = pending(user.id)

      const response = await sendWebhook(
        event('log_1', 'subscription.completed', {
          subscription: { id: 'subs_1', status: 'ACTIVE' },
          checkout: { externalId: subscription.id },
        }),
      )

      expect(response.statusCode).toBe(200)
      expect(subscription).toMatchObject({ status: 'active', providerSubscriptionId: 'subs_1' })
      expect(subscription.currentPeriodEnd?.getTime()).toBeGreaterThan(Date.now() + 27 * DAY)
      expect(store.mails.at(-1)?.subject).toBe('Seu Pro da Lynko está ativo')
    })

    it('cancels a second subscription paid for an account that is already active', async () => {
      const fetchSpy = mockAbacatePay()

      const { user } = signIn(app, store)

      const subscription = buildSubscription({ userId: user.id, providerSubscriptionId: 'subs_A' })

      store.subscriptions.push(subscription)

      const before = subscription.currentPeriodEnd

      const payload = event('log_dup', 'subscription.completed', {
        subscription: { id: 'subs_B' },
        checkout: { externalId: subscription.id },
      })

      const response = await sendWebhook(payload)

      await sendWebhook(payload)

      const cancels = fetchSpy.mock.calls.filter(([url]) =>
        String(url).endsWith('/subscriptions/cancel'),
      )

      expect(response.statusCode).toBe(200)
      expect(cancels).toHaveLength(1)
      expect(JSON.parse(String(cancels[0]?.[1]?.body))).toEqual({ id: 'subs_B' })
      expect(subscription.providerSubscriptionId).toBe('subs_A')
      expect(subscription.currentPeriodEnd).toEqual(before)
    })

    it('asks AbacatePay to retry when cancelling the duplicate fails', async () => {
      mockAbacatePay({ cancelFails: true })

      const { user } = signIn(app, store)

      const subscription = buildSubscription({ userId: user.id, providerSubscriptionId: 'subs_A' })

      store.subscriptions.push(subscription)

      const response = await sendWebhook(
        event('log_dup', 'subscription.completed', {
          subscription: { id: 'subs_B' },
          checkout: { externalId: subscription.id },
        }),
      )

      expect(response.statusCode).toBe(503)
      expect(store.billingEvents.has('log_dup')).toBe(false)
    })

    it('extends the period once on a repeated subscription.renewed', async () => {
      const { user } = signIn(app, store)

      const periodEnd = new Date(Date.now() + 2 * DAY)

      const subscription = buildSubscription({
        userId: user.id,
        providerSubscriptionId: 'subs_1',
        currentPeriodEnd: periodEnd,
      })

      store.subscriptions.push(subscription)

      const payload = event('log_renew', 'subscription.renewed', { subscription: { id: 'subs_1' } })

      await sendWebhook(payload)

      const afterFirst = subscription.currentPeriodEnd?.getTime()

      const repeated = await sendWebhook(payload)

      expect(repeated.statusCode).toBe(200)
      expect(afterFirst).toBeGreaterThan(periodEnd.getTime() + 27 * DAY)
      expect(subscription.currentPeriodEnd?.getTime()).toBe(afterFirst as number)
    })

    it('keeps Pro until the end of the period on subscription.cancelled', async () => {
      const { user, headers } = signIn(app, store)

      const subscription = buildSubscription({
        userId: user.id,
        providerSubscriptionId: 'subs_1',
        currentPeriodEnd: new Date(Date.now() + 5 * DAY),
      })

      store.subscriptions.push(subscription)

      await sendWebhook(
        event('log_c', 'subscription.cancelled', { subscription: { id: 'subs_1' } }),
      )

      const status = await app.inject({ method: 'GET', url: '/billing/subscription', headers })

      expect(subscription.status).toBe('cancelled')
      expect(status.json()).toMatchObject({ plan: 'pro', status: 'cancelled' })
    })

    it('records failed payments and unknown events without changing anything', async () => {
      const { user } = signIn(app, store)

      const subscription = buildSubscription({ userId: user.id, providerSubscriptionId: 'subs_1' })

      store.subscriptions.push(subscription)

      const before = { ...subscription }

      const failed = await sendWebhook(
        event('log_f', 'subscription.payment_failed', { subscription: { id: 'subs_1' } }),
      )

      const unknown = await sendWebhook(event('log_u', 'checkout.completed', {}))

      expect(failed.statusCode).toBe(200)
      expect(unknown.statusCode).toBe(200)
      expect(subscription).toEqual(before)
      expect(store.billingEvents.has('log_f')).toBe(true)
    })

    it('answers 400 for a signed body that is not a valid event', async () => {
      const response = await sendWebhook({ hello: 'world' })

      expect(response.statusCode).toBe(400)
    })

    it('answers 503 when the webhook is not configured', async () => {
      Object.assign(env, { ABACATEPAY_WEBHOOK_SECRET: undefined })

      const response = await sendWebhook(event('log_1', 'subscription.renewed', {}))

      expect(response.statusCode).toBe(503)
    })
  })

  describe('account deletion', () => {
    async function signInWithPassword() {
      return signIn(app, store, { user: { passwordHash: await hashPassword('right-pass') } })
    }

    it('cancels the active subscription before deleting the account', async () => {
      const fetchSpy = mockAbacatePay()

      const { user, headers } = await signInWithPassword()

      store.subscriptions.push(
        buildSubscription({ userId: user.id, providerSubscriptionId: 'subs_1' }),
      )

      const response = await app.inject({
        method: 'POST',
        url: '/users/me/deletion',
        headers,
        payload: { password: 'right-pass' },
      })

      expect(response.statusCode).toBe(204)
      expect(
        fetchSpy.mock.calls.some(([url]) => String(url).endsWith('/subscriptions/cancel')),
      ).toBe(true)
    })

    it('keeps the account when the cancellation fails', async () => {
      mockAbacatePay({ cancelFails: true })

      const { user, headers } = await signInWithPassword()

      store.subscriptions.push(
        buildSubscription({ userId: user.id, providerSubscriptionId: 'subs_1' }),
      )

      const response = await app.inject({
        method: 'POST',
        url: '/users/me/deletion',
        headers,
        payload: { password: 'right-pass' },
      })

      expect(response.statusCode).toBe(503)
      expect(store.users.some((item) => item.id === user.id)).toBe(true)
    })
  })
})
