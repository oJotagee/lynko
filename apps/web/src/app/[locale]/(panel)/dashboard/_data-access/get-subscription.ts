'use server'

import { isAxiosError } from 'axios'

import { api } from '@/lib/api'
import { getApiErrorMessage } from '@/lib/api-error'
import { getApiAuthorization, SessionExpiredError } from '@/lib/get-api-authorization'

export interface ApiSubscription {
  plan: 'free' | 'pro'
  status: 'pending' | 'active' | 'cancelled' | null
  cycle: 'monthly' | 'annually' | null
  currentPeriodEnd: string | null
  accessUntil: string | null
}

export async function getSubscription(): Promise<ApiSubscription> {
  try {
    const { data } = await api.get<ApiSubscription>('/billing/subscription', {
      headers: await getApiAuthorization(),
    })

    return data
  } catch (error) {
    if (
      error instanceof SessionExpiredError ||
      (isAxiosError(error) && error.response?.status === 401)
    )
      throw new SessionExpiredError()

    throw new Error(getApiErrorMessage(error, 'Não foi possível carregar seu plano.'))
  }
}
