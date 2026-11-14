'use server'

import { api } from '@/lib/api'
import { getApiErrorMessage } from '@/lib/api-error'

export interface ApiPlan {
  cycle: 'monthly' | 'annually'
  amount: number
  currency: string
}

export async function getPlans(): Promise<ApiPlan[]> {
  try {
    const { data } = await api.get<ApiPlan[]>('/billing/plans')

    return data
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Não foi possível carregar os preços.'))
  }
}
