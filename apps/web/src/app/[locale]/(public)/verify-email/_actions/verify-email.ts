'use server'

import { isAxiosError } from 'axios'
import { api } from '@/lib/api'
import { getApiErrorMessage } from '@/lib/api-error'

export async function verifyEmail(token: string): Promise<{ error?: string; invalid?: boolean }> {
  try {
    await api.post('/auth/verify-email', { token })

    return {}
  } catch (error) {
    return {
      error: getApiErrorMessage(error, 'Não foi possível confirmar o e-mail. Tente novamente.'),
      invalid: isAxiosError(error) && error.response?.status === 400,
    }
  }
}
