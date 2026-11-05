'use server'

import { api } from '@/lib/api'
import { getApiAuthorization } from '@/lib/get-api-authorization'
import { getDashboardError } from '@/lib/get-dashboard-error'

export async function deleteMedia(id: string): Promise<{ error?: string }> {
  try {
    await api.delete(`/media/${encodeURIComponent(id)}`, { headers: await getApiAuthorization() })

    return {}
  } catch (error) {
    return { error: getDashboardError(error, 'Não foi possível remover a imagem.') }
  }
}
