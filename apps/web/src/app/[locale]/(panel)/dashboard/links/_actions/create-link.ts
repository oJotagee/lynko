'use server'

import { revalidatePath } from 'next/cache'
import { api } from '@/lib/api'

import { getApiAuthorization } from '@/lib/get-api-authorization'
import { getDashboardError } from '@/lib/get-dashboard-error'
import type { ApiLink } from '../../_data-access/get-dashboard'
import type { LinkSchemaData } from '../_components/link-schema'
import { linkSchema } from '../_components/link-schema'

export async function createLink(
  input: LinkSchemaData,
): Promise<{ data?: ApiLink; error?: string }> {
  try {
    const values = linkSchema.parse(input)

    const { data } = await api.post<ApiLink>('/links', values, {
      headers: await getApiAuthorization(),
    })

    revalidatePath('/[locale]/dashboard', 'layout')

    return { data }
  } catch (error) {
    return { error: getDashboardError(error, 'Não foi possível criar o link') }
  }
}
