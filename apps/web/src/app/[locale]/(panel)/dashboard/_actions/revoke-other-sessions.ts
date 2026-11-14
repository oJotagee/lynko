'use server'

import { api } from '@/lib/api'
import { getApiErrorMessage } from '@/lib/api-error'
import { getApiAuthorization } from '@/lib/get-api-authorization'

export async function revokeOtherSessions(): Promise<{
  data?: { revoked: number }
  error?: string
}> {
  try {
    const { data } = await api.delete<{ revoked: number }>('/users/me/sessions', {
      headers: await getApiAuthorization(),
    })

    return { data }
  } catch (error) {
    return {
      error: getApiErrorMessage(
        error,
        'Não foi possível desconectar os outros dispositivos. Tente novamente.',
      ),
    }
  }
}
