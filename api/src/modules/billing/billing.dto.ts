import { z } from 'zod'

export const billingCycle = z.enum(['monthly', 'annually'])

export const plansResponse = z.array(
  z.object({ cycle: billingCycle, amount: z.number().int(), currency: z.string() }),
)

export const subscriptionResponse = z.object({
  plan: z.enum(['free', 'pro']),
  status: z.enum(['pending', 'active', 'cancelled']).nullable(),
  cycle: billingCycle.nullable(),
  currentPeriodEnd: z.date().nullable(),
  accessUntil: z.date().nullable(),
})

export type BillingCycle = z.infer<typeof billingCycle>

export const checkoutBody = z.object({ cycle: billingCycle })

export const checkoutResponse = z.object({ url: z.url() })

export const cancelResponse = z.object({ accessUntil: z.date().nullable() })
