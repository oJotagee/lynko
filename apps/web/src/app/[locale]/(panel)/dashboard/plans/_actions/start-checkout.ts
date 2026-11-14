'use server'

import { isAxiosError } from 'axios'

import { api } from '@/lib/api'
import { getApiErrorMessage } from '@/lib/api-error'
import { getApiAuthorization } from '@/lib/get-api-authorization'

const MESSAGES: Record<string, string> = {
  'Subscription already active': 'Você já é Pro.',
  'Billing unavailable': 'Não foi possível falar com o sistema de pagamento. Tente em instantes.',
}

export async function startCheckout(
  cycle: 'monthly' | 'annually',
): Promise<{ data?: { url: string }; error?: string }> {
  try {
    const { data } = await api.post<{ url: string }>(
      '/billing/checkout',
      { cycle },
      { headers: await getApiAuthorization() },
    )

    return { data }
  } catch (error) {
    const message = isAxiosError(error) ? error.response?.data?.message : undefined

    return {
      error:
        (typeof message === 'string' && MESSAGES[message]) ||
        getApiErrorMessage(error, 'Não foi possível abrir o pagamento. Tente novamente.'),
    }
  }
}
