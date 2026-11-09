'use server'

import { api } from '@/lib/api'
import { getApiErrorMessage } from '@/lib/api-error'

export async function forgotPassword(email: string): Promise<{ error?: string }> {
  try {
    await api.post('/auth/forgot-password', { email })

    return {}
  } catch (error) {
    return {
      error: getApiErrorMessage(error, 'Não foi possível enviar o link agora. Tente novamente.'),
    }
  }
}
