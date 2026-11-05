'use server'

import { api } from '@/lib/api'
import { getApiAuthorization } from '@/lib/get-api-authorization'
import { getDashboardError } from '@/lib/get-dashboard-error'
import type { MediaType } from '../_components/upload/image-upload-schema'

export interface MediaUpload {
  mediaId: string
  uploadUrl: string
  expiresIn: number
}

export interface PresignMediaInput {
  type: MediaType
  fileName: string
  contentType: string
  size: number
}

export async function presignMedia(
  input: PresignMediaInput,
): Promise<{ data?: MediaUpload; error?: string }> {
  try {
    const { data } = await api.post<MediaUpload>('/media/presign', input, {
      headers: await getApiAuthorization(),
    })

    return { data }
  } catch (error) {
    return { error: getDashboardError(error, 'Não foi possível preparar o envio da imagem.') }
  }
}
