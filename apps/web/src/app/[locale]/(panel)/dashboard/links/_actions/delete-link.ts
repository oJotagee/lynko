'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { api } from '@/lib/api'
import { getApiAuthorization } from '@/lib/get-api-authorization'
import { getDashboardError } from '@/lib/get-dashboard-error'

export async function deleteLink(id: string): Promise<{ data?: true; error?: string }> {
  try {
    const linkId = z.uuid().parse(id)

    await api.delete(`/links/${linkId}`, { headers: await getApiAuthorization() })

    revalidatePath('/[locale]/dashboard', 'layout')

    return { data: true }
  } catch (error) {
    return { error: getDashboardError(error, 'Não foi possível excluir o link') }
  }
}
