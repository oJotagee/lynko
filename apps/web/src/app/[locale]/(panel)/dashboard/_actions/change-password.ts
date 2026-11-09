'use server'

import { isAxiosError } from 'axios'

import { api } from '@/lib/api'
import { getApiErrorMessage } from '@/lib/api-error'
import { getApiAuthorization } from '@/lib/get-api-authorization'

export interface ChangePasswordInput {
  currentPassword: string
  newPassword: string
}

const MESSAGES: Record<string, string> = {
  'Invalid current password': 'A senha atual está incorreta.',
  'New password must be different from the current one':
    'A nova senha precisa ser diferente da atual.',
  'Account has no password': 'Esta conta entra pelo Google e não tem senha para alterar.',
}

export async function changePassword(
  input: ChangePasswordInput,
): Promise<{ data?: true; error?: string }> {
  try {
    await api.patch('/users/me/password', input, { headers: await getApiAuthorization() })

    return { data: true }
  } catch (error) {
    const message = isAxiosError(error) ? error.response?.data?.message : undefined

    return {
      error:
        (typeof message === 'string' && MESSAGES[message]) ||
        getApiErrorMessage(error, 'Não foi possível alterar a senha. Tente novamente.'),
    }
  }
}
