'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { api } from '@/lib/api'
import { getApiAuthorization } from '@/lib/get-api-authorization'
import { getDashboardError } from '@/lib/get-dashboard-error'
import type { ApiLink } from '../../_data-access/get-dashboard'

export async function reorderLinks(
  linkIds: string[],
): Promise<{ data?: ApiLink[]; error?: string }> {
  try {
    const ids = z.array(z.uuid()).min(1).max(100).parse(linkIds)

    const { data } = await api.put<ApiLink[]>(
      '/links/reorder',
      { linkIds: ids },
      { headers: await getApiAuthorization() },
    )

    revalidatePath('/[locale]/dashboard', 'layout')

    return { data }
  } catch (error) {
    return { error: getDashboardError(error, 'Não foi possível reordenar os links') }
  }
}
