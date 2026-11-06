import { isAxiosError } from 'axios'

import { api } from '@/lib/api'
import { getApiErrorMessage } from '@/lib/api-error'
import { getApiAuthorization, SessionExpiredError } from '@/lib/get-api-authorization'
import type { AnalyticsPeriod } from './analytics-period'

export async function fetchAnalytics<T>(path: string, period: AnalyticsPeriod): Promise<T> {
  try {
    const headers = await getApiAuthorization()

    const { data } = await api.get<T>(`/analytics/${path}`, { headers, params: { period } })

    return data
  } catch (error) {
    if (
      error instanceof SessionExpiredError ||
      (isAxiosError(error) && error.response?.status === 401)
    )
      throw new SessionExpiredError()

    throw new Error(getApiErrorMessage(error, 'Não foi possível carregar o analytics.'))
  }
}
