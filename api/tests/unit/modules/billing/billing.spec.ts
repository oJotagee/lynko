import { afterEach, beforeEach, describe, expect, it, mock, spyOn } from 'bun:test'
import { env } from '../../../../src/config/env'
import { abacatePay } from '../../../../src/modules/billing/abacatepay.client'
import { isPro, proAccessUntil } from '../../../../src/modules/billing/billing.access'
import { billingService } from '../../../../src/modules/billing/billing.service'
import { createTestApp, signIn } from '../../support/app'
import { buildSubscription } from '../../support/builders'
import { useInMemoryRepositories } from '../../support/memory-repositories'

const DAY = 24 * 60 * 60 * 1000

const now = new Date('2026-11-14T12:00:00.000Z')

const at = (days: number) => new Date(now.getTime() + days * DAY)

const billingEnv = {
  ABACATEPAY_API_KEY: 'abc_dev_test-key',
  ABACATEPAY_PRO_MONTHLY_PRODUCT_ID: 'prod_monthly',
  ABACATEPAY_PRO_ANNUAL_PRODUCT_ID: 'prod_annual',
}

const noBillingEnv = {
  ABACATEPAY_API_KEY: undefined,
  ABACATEPAY_PRO_MONTHLY_PRODUCT_ID: undefined,
  ABACATEPAY_PRO_ANNUAL_PRODUCT_ID: undefined,
}

const products: Record<string, { price: number; cycle: string }> = {
  prod_monthly: { price: 1990, cycle: 'MONTHLY' },
  prod_annual: { price: 19990, cycle: 'ANNUALLY' },
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

function mockFetch() {
  return spyOn(globalThis, 'fetch').mockImplementation((async (input: string | URL) => {
    const url = new URL(String(input))

    const id = url.searchParams.get('id') ?? ''

    const product = products[id]

    if (url.pathname === '/v2/products/get' && product) {
      return jsonResponse({ data: { id, currency: 'BRL', ...product }, success: true, error: null })
    }

    if (url.pathname === '/v2/subscriptions/create') {
      return jsonResponse({
        data: { id: 'bill_1', url: 'https://app.abacatepay.com/pay/bill_1', status: 'PENDING' },
        success: true,
        error: null,
      })
    }

    return jsonResponse({ data: null, success: false, error: 'Not found' }, 404)
  }) as typeof fetch)
}

describe('billing access', () => {
  it('keeps an active subscription for 3 more days to cover renewal retries', () => {
    const active = { status: 'active' as const, currentPeriodEnd: at(-2) }

    expect(proAccessUntil(active)).toEqual(at(1))
    expect(isPro(active, now)).toBe(true)
    expect(isPro({ ...active, currentPeriodEnd: at(-4) }, now)).toBe(false)
  })

  it('keeps a cancelled subscription only until the end of the paid period', () => {
    expect(isPro({ status: 'cancelled', currentPeriodEnd: at(5) }, now)).toBe(true)
    expect(isPro({ status: 'cancelled', currentPeriodEnd: at(-1) }, now)).toBe(false)
  })

  it('is free without a subscription or a paid period', () => {
    expect(isPro(null, now)).toBe(false)
    expect(isPro({ status: 'pending', currentPeriodEnd: null }, now)).toBe(false)
  })
})

describe('billing routes', () => {
  let store: ReturnType<typeof useInMemoryRepositories>

  let app: Awaited<ReturnType<typeof createTestApp>>

  const original = { ...env }

  beforeEach(async () => {
    store = useInMemoryRepositories()

    app = await createTestApp()

    billingService.resetPlansCache()
  })

  afterEach(async () => {
    Object.assign(env, original)

    await app.close()

    mock.restore()
  })

  describe('GET /billing/plans', () => {
    it('answers 503 when billing is not configured', async () => {
      Object.assign(env, noBillingEnv)

      const fetchSpy = mockFetch()

      const response = await app.inject({ method: 'GET', url: '/billing/plans' })

      expect(response.statusCode).toBe(503)
      expect(fetchSpy).not.toHaveBeenCalled()
    })

    it('returns the monthly and annual prices from AbacatePay and caches them', async () => {
      Object.assign(env, billingEnv)

      const fetchSpy = mockFetch()

      const response = await app.inject({ method: 'GET', url: '/billing/plans' })

      await app.inject({ method: 'GET', url: '/billing/plans' })

      expect(response.statusCode).toBe(200)
      expect(response.json()).toEqual([
        { cycle: 'monthly', amount: 1990, currency: 'BRL' },
        { cycle: 'annually', amount: 19990, currency: 'BRL' },
      ])
      expect(fetchSpy).toHaveBeenCalledTimes(2)

      const [url, init] = fetchSpy.mock.calls[0] ?? []

      expect(String(url)).toBe('https://api.abacatepay.com/v2/products/get?id=prod_monthly')
      expect(new Headers(init?.headers).get('authorization')).toBe('Bearer abc_dev_test-key')
    })

    it('answers 503 when AbacatePay fails and tries again on the next call', async () => {
      Object.assign(env, billingEnv, { ABACATEPAY_PRO_ANNUAL_PRODUCT_ID: 'prod_missing' })

      mockFetch()

      const response = await app.inject({ method: 'GET', url: '/billing/plans' })

      expect(response.statusCode).toBe(503)
      expect(response.json()).toEqual({ message: 'Billing unavailable' })

      Object.assign(env, billingEnv)

      const retry = await app.inject({ method: 'GET', url: '/billing/plans' })

      expect(retry.statusCode).toBe(200)
    })
  })

  describe('GET /billing/subscription', () => {
    it('returns the free plan without a subscription', async () => {
      const { headers } = signIn(app, store)

      const response = await app.inject({ method: 'GET', url: '/billing/subscription', headers })

      expect(response.statusCode).toBe(200)
      expect(response.json()).toEqual({
        plan: 'free',
        status: null,
        cycle: null,
        currentPeriodEnd: null,
        accessUntil: null,
      })
    })

    it('returns the pro plan with the period and the access end', async () => {
      const { user, headers } = signIn(app, store)

      const subscription = buildSubscription({ userId: user.id, cycle: 'annually' })

      store.subscriptions.push(subscription)

      const response = await app.inject({ method: 'GET', url: '/billing/subscription', headers })

      expect(response.json()).toMatchObject({
        plan: 'pro',
        status: 'active',
        cycle: 'annually',
        currentPeriodEnd: subscription.currentPeriodEnd?.toISOString(),
      })
    })

    it('answers 401 without a token', async () => {
      const response = await app.inject({ method: 'GET', url: '/billing/subscription' })

      expect(response.statusCode).toBe(401)
    })
  })

  describe('GET /users/me', () => {
    it('includes the plan', async () => {
      const { user, headers } = signIn(app, store)

      const free = await app.inject({ method: 'GET', url: '/users/me', headers })

      store.subscriptions.push(buildSubscription({ userId: user.id }))

      const pro = await app.inject({ method: 'GET', url: '/users/me', headers })

      expect(free.json().plan).toBe('free')
      expect(pro.json().plan).toBe('pro')
    })
  })
})

describe('AbacatePay client', () => {
  const original = { ...env }

  afterEach(() => {
    Object.assign(env, original)

    mock.restore()
  })

  it('creates the subscription checkout with one product and the user reference', async () => {
    Object.assign(env, billingEnv)

    const fetchSpy = mockFetch()

    const checkout = await abacatePay.createSubscriptionCheckout({
      productId: 'prod_annual',
      customerId: 'cust_1',
      externalId: 'sub-row-1',
      userId: 'user-1',
      completionUrl: 'https://lynko.test/dashboard/plans/success',
      returnUrl: 'https://lynko.test/dashboard/plans',
    })

    expect(checkout).toEqual({ id: 'bill_1', url: 'https://app.abacatepay.com/pay/bill_1' })

    const [url, init] = fetchSpy.mock.calls[0] ?? []

    expect(String(url)).toBe('https://api.abacatepay.com/v2/subscriptions/create')
    expect(init?.method).toBe('POST')
    expect(JSON.parse(String(init?.body))).toEqual({
      items: [{ id: 'prod_annual', quantity: 1 }],
      customerId: 'cust_1',
      externalId: 'sub-row-1',
      metadata: { userId: 'user-1' },
      methods: ['CARD'],
      completionUrl: 'https://lynko.test/dashboard/plans/success',
      returnUrl: 'https://lynko.test/dashboard/plans',
    })
  })

  it('throws 503 without a key and on network errors', async () => {
    Object.assign(env, noBillingEnv)

    await expect(abacatePay.getProduct('prod_monthly')).rejects.toMatchObject({ statusCode: 503 })

    Object.assign(env, billingEnv)

    spyOn(globalThis, 'fetch').mockRejectedValue(new Error('offline'))

    await expect(abacatePay.getProduct('prod_monthly')).rejects.toMatchObject({ statusCode: 503 })
  })
})
