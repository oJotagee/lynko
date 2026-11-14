'use server'

import { isAxiosError } from 'axios'

import { api } from '@/lib/api'
import { getApiErrorMessage } from '@/lib/api-error'
import { getApiAuthorization, SessionExpiredError } from '@/lib/get-api-authorization'

export interface ApiSession {
  id: string
  browser: string | null
  os: string | null
  createdAt: string
  lastActiveAt: string
  current: boolean
}

export async function getSessions(): Promise<ApiSession[]> {
  try {
    const { data } = await api.get<ApiSession[]>('/users/me/sessions', {
      headers: await getApiAuthorization(),
    })

    return data
  } catch (error) {
    if (
      error instanceof SessionExpiredError ||
      (isAxiosError(error) && error.response?.status === 401)
    )
      throw new SessionExpiredError()

    throw new Error(getApiErrorMessage(error, 'Não foi possível carregar os dispositivos.'))
  }
}
