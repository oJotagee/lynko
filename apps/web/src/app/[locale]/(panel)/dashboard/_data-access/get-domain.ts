'use server'

import { isAxiosError } from 'axios'

import { api } from '@/lib/api'
import { getDomainError } from '@/lib/domain-error'
import { getApiAuthorization, SessionExpiredError } from '@/lib/get-api-authorization'

export type DomainStatus = 'pending_owner' | 'pending_dns' | 'active' | 'error'

export type DomainError = 'txt_missing' | 'dns_misconfigured' | 'in_use_elsewhere' | 'vercel_failed'

export interface DomainRecord {
  type: 'A' | 'CNAME' | 'TXT'
  name: string
  value: string
  purpose: 'ownership' | 'routing' | 'verification'
}

export interface ApiDomain {
  hostname: string
  kind: 'apex' | 'subdomain'
  status: DomainStatus
  lastError: DomainError | null
  records: DomainRecord[]
  checkedAt: string | null
}

export async function getDomain(): Promise<ApiDomain | null> {
  try {
    const { data } = await api.get<ApiDomain | null>('/domains/me', {
      headers: await getApiAuthorization(),
    })

    return data
  } catch (error) {
    if (
      error instanceof SessionExpiredError ||
      (isAxiosError(error) && error.response?.status === 401)
    )
      throw new SessionExpiredError()

    throw new Error(getDomainError(error, 'Não foi possível carregar seu domínio.'))
  }
}
