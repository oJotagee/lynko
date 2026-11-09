'use server'

import { isAxiosError } from 'axios'
import { revalidatePath } from 'next/cache'

import { api } from '@/lib/api'
import { getApiErrorMessage } from '@/lib/api-error'
import { signOut } from '@/lib/auth'
import { getApiAuthorization } from '@/lib/get-api-authorization'

const MESSAGES: Record<string, string> = {
  'Invalid password': 'Senha incorreta.',
}

export async function deleteAccount(input: {
  password?: string
}): Promise<{ data?: { deleted: true } | { emailSent: true }; error?: string }> {
  try {
    const response = await api.post('/users/me/deletion', input, {
      headers: await getApiAuthorization(),
    })

    if (response.status === 202) return { data: { emailSent: true } }
  } catch (error) {
    const message = isAxiosError(error) ? error.response?.data?.message : undefined

    return {
      error:
        (typeof message === 'string' && MESSAGES[message]) ||
        getApiErrorMessage(error, 'Não foi possível excluir a conta. Tente novamente.'),
    }
  }

  try {
    await signOut({ redirect: false })

    revalidatePath('/[locale]', 'layout')
  } catch {}

  return { data: { deleted: true } }
}
