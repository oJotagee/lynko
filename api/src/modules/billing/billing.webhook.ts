import { createHash, createHmac, timingSafeEqual } from 'node:crypto'
import { z } from 'zod'
import { env } from '../../config/env'
import { BadRequestError, ServiceUnavailableError, UnauthorizedError } from '../../shared/errors'

export const webhookEvent = z.object({
  id: z.string().min(1).max(64),
  event: z.string().min(1).max(40),
  data: z
    .object({
      subscription: z.object({ id: z.string().min(1).max(64) }).optional(),
      checkout: z.object({ externalId: z.string().nullish() }).optional(),
    })
    .default({}),
})

export type WebhookEvent = z.infer<typeof webhookEvent>

function sameText(received: string | undefined, expected: string) {
  if (!received) return false

  const a = createHash('sha256').update(received).digest()

  const b = createHash('sha256').update(expected).digest()

  return timingSafeEqual(a, b)
}

function header(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export function verifyWebhook(
  rawBody: Buffer,
  headers: Record<string, string | string[] | undefined>,
  query: Record<string, unknown>,
) {
  const secret = env.ABACATEPAY_WEBHOOK_SECRET

  const publicKey = env.ABACATEPAY_WEBHOOK_PUBLIC_KEY

  if (!secret || !publicKey) throw new ServiceUnavailableError('Billing unavailable')

  const receivedSecret =
    header(headers['x-webhook-secret']) ||
    (typeof query.webhookSecret === 'string' ? query.webhookSecret : undefined)

  const signature = createHmac('sha256', publicKey).update(rawBody).digest('base64')

  if (
    !sameText(receivedSecret, secret) ||
    !sameText(header(headers['x-webhook-signature']), signature)
  ) {
    throw new UnauthorizedError('Invalid webhook')
  }

  let body: unknown

  try {
    body = JSON.parse(rawBody.toString('utf8'))
  } catch {
    throw new BadRequestError('Invalid webhook payload')
  }

  const parsed = webhookEvent.safeParse(body)

  if (!parsed.success) throw new BadRequestError('Invalid webhook payload')

  return parsed.data
}
