'use server'

import { isAxiosError } from 'axios'

import { api } from '@/lib/api'
import { getApiErrorMessage } from '@/lib/api-error'
import { getApiAuthorization, SessionExpiredError } from '@/lib/get-api-authorization'

export interface TwoFactorStatus {
  enabled: boolean
  recoveryCodesLeft: number
}

export async function getTwoFactor(): Promise<TwoFactorStatus> {
  try {
    const { data } = await api.get<TwoFactorStatus>('/users/me/two-factor', {
      headers: await getApiAuthorization(),
    })

    return data
  } catch (error) {
    if (
      error instanceof SessionExpiredError ||
      (isAxiosError(error) && error.response?.status === 401)
    )
      throw new SessionExpiredError()

    throw new Error(getApiErrorMessage(error, 'Não foi possível carregar o login em duas etapas.'))
  }
}
