'use server'

import { isAxiosError } from 'axios'

import { api } from '@/lib/api'
import { getApiErrorMessage } from '@/lib/api-error'
import { getApiAuthorization } from '@/lib/get-api-authorization'

const MESSAGES: Record<string, string> = {
  'No active subscription': 'Você não tem uma assinatura ativa para cancelar.',
  'Billing unavailable': 'Não foi possível falar com o sistema de pagamento. Tente em instantes.',
}

export async function cancelSubscription(): Promise<{
  data?: { accessUntil: string | null }
  error?: string
}> {
  try {
    const { data } = await api.post<{ accessUntil: string | null }>(
      '/billing/subscription/cancel',
      null,
      { headers: await getApiAuthorization() },
    )

    return { data }
  } catch (error) {
    const message = isAxiosError(error) ? error.response?.data?.message : undefined

    return {
      error:
        (typeof message === 'string' && MESSAGES[message]) ||
        getApiErrorMessage(error, 'Não foi possível cancelar. Tente novamente.'),
    }
  }
}
