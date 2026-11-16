'use server'

import { revalidatePath } from 'next/cache'

import { api } from '@/lib/api'
import { getDomainError } from '@/lib/domain-error'
import { getApiAuthorization } from '@/lib/get-api-authorization'
import type { ApiDomain } from '../_data-access/get-domain'

export async function checkDomain(): Promise<{ data?: ApiDomain; error?: string }> {
  try {
    const { data } = await api.post<ApiDomain>('/domains/me/check', null, {
      headers: await getApiAuthorization(),
    })

    if (data.status === 'active') revalidatePath('/[locale]/dashboard', 'layout')

    return { data }
  } catch (error) {
    return { error: getDomainError(error, 'Não foi possível verificar agora. Tente novamente.') }
  }
}
