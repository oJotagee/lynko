'use server'

import { isAxiosError } from 'axios'
import { revalidatePath } from 'next/cache'

import { api } from '@/lib/api'
import { getApiErrorMessage } from '@/lib/api-error'
import { signOut } from '@/lib/auth'

export interface ResetPasswordInput {
  token: string
  password: string
}

const INVALID_LINK_MESSAGE = 'Invalid or expired token'

export async function resetPassword(
  input: ResetPasswordInput,
): Promise<{ error?: string; invalid?: boolean }> {
  try {
    await api.post('/auth/reset-password', input)
  } catch (error) {
    return {
      error: getApiErrorMessage(error, 'Não foi possível redefinir a senha. Tente novamente.'),
      invalid:
        isAxiosError(error) &&
        error.response?.status === 400 &&
        error.response.data?.message === INVALID_LINK_MESSAGE,
    }
  }

  try {
    await signOut({ redirect: false })

    revalidatePath('/[locale]', 'layout')
  } catch {}

  return {}
}
