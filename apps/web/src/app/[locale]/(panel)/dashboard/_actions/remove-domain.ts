'use server'

import { revalidatePath } from 'next/cache'

import { api } from '@/lib/api'
import { getDomainError } from '@/lib/domain-error'
import { getApiAuthorization } from '@/lib/get-api-authorization'

export async function removeDomain(): Promise<{ error?: string }> {
  try {
    await api.delete('/domains/me', { headers: await getApiAuthorization() })

    revalidatePath('/[locale]/dashboard', 'layout')

    return {}
  } catch (error) {
    return { error: getDomainError(error, 'Não foi possível remover o domínio. Tente novamente.') }
  }
}
