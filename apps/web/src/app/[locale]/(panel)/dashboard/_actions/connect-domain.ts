'use server'

import { z } from 'zod'

import { api } from '@/lib/api'
import { getDomainError } from '@/lib/domain-error'
import { getApiAuthorization } from '@/lib/get-api-authorization'
import type { ApiDomain } from '../_data-access/get-domain'

const connectDomainInput = z.object({ hostname: z.string().trim().min(1).max(253) })

export async function connectDomain(input: {
  hostname: string
}): Promise<{ data?: ApiDomain; error?: string }> {
  const parsed = connectDomainInput.safeParse(input)

  if (!parsed.success) return { error: 'Digite um domínio válido, como seunome.com.' }

  try {
    const { data } = await api.post<ApiDomain>('/domains/me', parsed.data, {
      headers: await getApiAuthorization(),
    })

    return { data }
  } catch (error) {
    return { error: getDomainError(error, 'Não foi possível ligar o domínio. Tente novamente.') }
  }
}
