'use server'

import { api } from '@/lib/api'
import { getApiErrorMessage } from '@/lib/api-error'
import { getApiAuthorization } from '@/lib/get-api-authorization'

export async function resendVerification(): Promise<{
  data?: { retryAfter: number }
  error?: string
}> {
  try {
    const { data } = await api.post<{ retryAfter: number }>('/auth/verify-email/resend', null, {
      headers: await getApiAuthorization(),
    })

    return { data }
  } catch (error) {
    return {
      error: getApiErrorMessage(error, 'Não foi possível reenviar o e-mail. Tente novamente.'),
    }
  }
}
