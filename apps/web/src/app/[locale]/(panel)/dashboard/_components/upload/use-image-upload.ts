import { useMutation } from '@tanstack/react-query'
import { useRef } from 'react'

import { type ApiMedia, confirmMedia } from '../../_actions/confirm-media'
import { deleteMedia } from '../../_actions/delete-media'
import { presignMedia } from '../../_actions/presign-media'
import type { MediaType } from './image-upload-schema'

const UPLOAD_ERROR = 'Não foi possível enviar a imagem. Tente novamente.'

async function sendFile(type: MediaType, file: File) {
  const presign = await presignMedia({
    type,
    fileName: file.name,
    contentType: file.type,
    size: file.size,
  })

  if (!presign.data) throw new Error(presign.error ?? UPLOAD_ERROR)

  const { mediaId, uploadUrl } = presign.data

  try {
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file,
    })

    return { mediaId, status: response.status }
  } catch {
    return { mediaId, status: 0 }
  }
}

async function uploadImage(type: MediaType, file: File): Promise<ApiMedia> {
  let upload = await sendFile(type, file)

  if (upload.status === 403) {
    await deleteMedia(upload.mediaId)

    upload = await sendFile(type, file)
  }

  if (upload.status < 200 || upload.status >= 300) {
    await deleteMedia(upload.mediaId)

    throw new Error(UPLOAD_ERROR)
  }

  const confirmed = await confirmMedia(upload.mediaId)

  if (!confirmed.data) throw new Error(confirmed.error ?? UPLOAD_ERROR)

  return confirmed.data
}

export function useImageUpload(type: MediaType) {
  return useMutation({ mutationFn: (file: File) => uploadImage(type, file) })
}

export function useUnsavedMedia() {
  const uploaded = useRef<string[]>([])

  const { mutate } = useMutation({ mutationFn: deleteMedia })

  return {
    track(id: string) {
      uploaded.current.push(id)
    },

    flush(keepId: string | null | undefined) {
      for (const id of uploaded.current) {
        if (id !== keepId) mutate(id)
      }

      uploaded.current = []
    },
  }
}
