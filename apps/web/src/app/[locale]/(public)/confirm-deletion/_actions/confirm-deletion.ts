'use server'

import { isAxiosError } from 'axios'
import { revalidatePath } from 'next/cache'

import { api } from '@/lib/api'
import { getApiErrorMessage } from '@/lib/api-error'
import { signOut } from '@/lib/auth'

const INVALID_LINK_MESSAGE = 'Invalid or expired token'

export async function confirmDeletion(
  token: string,
): Promise<{ error?: string; invalid?: boolean }> {
  try {
    await api.post('/auth/confirm-deletion', { token })
  } catch (error) {
    return {
      error: getApiErrorMessage(error, 'Não foi possível excluir a conta. Tente novamente.'),
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
