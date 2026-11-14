'use server'

import { isAxiosError } from 'axios'

import { api } from '@/lib/api'
import { getApiErrorMessage } from '@/lib/api-error'
import { getApiAuthorization } from '@/lib/get-api-authorization'

const MESSAGES: Record<string, string> = {
  'Session not found': 'Este dispositivo já estava desconectado.',
  'Use logout to end the current session': 'Para sair deste dispositivo, use o botão Sair.',
}

export async function revokeSession(sessionId: string): Promise<{ data?: true; error?: string }> {
  try {
    await api.delete(`/users/me/sessions/${encodeURIComponent(sessionId)}`, {
      headers: await getApiAuthorization(),
    })

    return { data: true }
  } catch (error) {
    const message = isAxiosError(error) ? error.response?.data?.message : undefined

    return {
      error:
        (typeof message === 'string' && MESSAGES[message]) ||
        getApiErrorMessage(error, 'Não foi possível desconectar o dispositivo. Tente novamente.'),
    }
  }
}
