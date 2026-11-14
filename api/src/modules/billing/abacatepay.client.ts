import { z } from 'zod'
import { env } from '../../config/env'
import { ServiceUnavailableError } from '../../shared/errors'

const BASE_URL = 'https://api.abacatepay.com/v2'

const TIMEOUT_MS = 10_000

const customer = z.object({ id: z.string() })

const checkout = z.object({ id: z.string(), url: z.url() })

const subscription = z.object({ id: z.string(), status: z.string() })

const product = z.object({
  id: z.string(),
  price: z.number().int(),
  currency: z.string(),
  cycle: z.string().nullable(),
})

export type AbacatePayProduct = z.infer<typeof product>

export interface SubscriptionCheckoutInput {
  productId: string
  customerId: string
  externalId: string
  userId: string
  completionUrl: string
  returnUrl: string
}

function unavailable() {
  return new ServiceUnavailableError('Billing unavailable')
}

async function request<T>(path: string, schema: z.ZodType<T>, init: RequestInit = {}) {
  if (!env.ABACATEPAY_API_KEY) throw unavailable()

  let response: Response

  try {
    response = await fetch(`${BASE_URL}${path}`, {
      ...init,
      headers: {
        authorization: `Bearer ${env.ABACATEPAY_API_KEY}`,
        'content-type': 'application/json',
      },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
  } catch {
    throw unavailable()
  }

  const body = await response.json().catch(() => null)

  const parsed = z.object({ data: schema }).safeParse(body)

  if (!response.ok || !parsed.success) {
    console.error('AbacatePay request failed', path, response.status)

    throw unavailable()
  }

  return parsed.data.data
}

function post<T>(path: string, schema: z.ZodType<T>, payload: unknown) {
  return request(path, schema, { method: 'POST', body: JSON.stringify(payload) })
}

export const abacatePay = {
  isConfigured() {
    return Boolean(env.ABACATEPAY_API_KEY)
  },

  async createCustomer(input: { email: string; name: string }) {
    return post('/customers/create', customer, input)
  },

  async createSubscriptionCheckout(input: SubscriptionCheckoutInput) {
    return post('/subscriptions/create', checkout, {
      items: [{ id: input.productId, quantity: 1 }],
      customerId: input.customerId,
      externalId: input.externalId,
      metadata: { userId: input.userId },
      methods: env.ABACATEPAY_METHODS,
      completionUrl: input.completionUrl,
      returnUrl: input.returnUrl,
    })
  },

  async cancelSubscription(id: string) {
    return post('/subscriptions/cancel', subscription, { id })
  },

  async getProduct(id: string) {
    return request(`/products/get?id=${encodeURIComponent(id)}`, product)
  },
}
