'use server'

import { isAxiosError } from 'axios'
import { api } from '@/lib/api'
import { getApiErrorMessage } from '@/lib/api-error'

export interface RegisterInput {
  name: string
  email: string
  password: string
}

export async function registerUser(input: RegisterInput): Promise<{ error?: string }> {
  try {
    await api.post('/auth/register', input)

    return {}
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 409) {
      return { error: 'Já existe uma conta com este e-mail.' }
    }

    return {
      error: getApiErrorMessage(error, 'Não foi possível criar sua conta. Tente novamente.'),
    }
  }
}
