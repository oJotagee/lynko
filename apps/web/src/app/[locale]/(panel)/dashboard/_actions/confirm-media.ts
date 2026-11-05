'use server'

import { api } from '@/lib/api'
import { getApiAuthorization } from '@/lib/get-api-authorization'
import { getDashboardError } from '@/lib/get-dashboard-error'

export interface ApiMedia {
  id: string
  type: 'avatar' | 'background'
  status: 'pending' | 'ready' | 'failed'
  mimeType: string
  size: number
  url: string | null
}

export async function confirmMedia(id: string): Promise<{ data?: ApiMedia; error?: string }> {
  try {
    const { data } = await api.post<ApiMedia>(`/media/${encodeURIComponent(id)}/confirm`, null, {
      headers: await getApiAuthorization(),
    })

    return { data }
  } catch (error) {
    return { error: getDashboardError(error, 'Não foi possível validar a imagem enviada.') }
  }
}
