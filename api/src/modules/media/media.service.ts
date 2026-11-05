import { randomUUID } from 'node:crypto'

import { env } from '../../config/env'
import type { mediaSchema } from '../../db/schema'
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
  ServiceUnavailableError,
} from '../../shared/errors'
import { getBackgroundMediaId } from '../pages/pages.appearance'
import { pagesRepository } from '../pages/pages.repository'
import { mediaMaxBytes, type PresignMediaBody } from './media.dto'
import { mediaRepository } from './media.repository'
import { mediaStorage, UPLOAD_EXPIRES_IN } from './media.storage'

type Media = typeof mediaSchema.$inferSelect

const MEDIA_NOT_FOUND = 'Media not found'

const imageSignatures = [
  { mimeType: 'image/jpeg', extension: 'jpg', bytes: [[0, [0xff, 0xd8, 0xff]]] },
  {
    mimeType: 'image/png',
    extension: 'png',
    bytes: [[0, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]]],
  },
  {
    mimeType: 'image/webp',
    extension: 'webp',
    bytes: [
      [0, [0x52, 0x49, 0x46, 0x46]],
      [8, [0x57, 0x45, 0x42, 0x50]],
    ],
  },
] as const

export function detectImageType(head: Uint8Array) {
  return imageSignatures.find((signature) =>
    signature.bytes.every(([offset, bytes]) =>
      bytes.every((byte, index) => head[offset + index] === byte),
    ),
  )
}

function assertStorageConfigured() {
  if (!env.AWS_REGION || !env.S3_BUCKET || !env.CDN_URL) {
    throw new ServiceUnavailableError('Media storage is not configured')
  }
}

async function getPageIdOrThrow(userId: string) {
  const page = await pagesRepository.findByUserId(userId)

  if (!page) {
    throw new NotFoundError('Page not found')
  }

  return page.id
}

async function getMediaOrThrow(id: string, pageId: string) {
  const media = await mediaRepository.findById(id, pageId)

  if (!media) {
    throw new NotFoundError(MEDIA_NOT_FOUND)
  }

  return media
}

export function getMediaUrl(key: string) {
  return env.CDN_URL ? `${env.CDN_URL}/${key}` : null
}

function toResponse({ id, type, status, mimeType, size, key }: Media) {
  return {
    id,
    type,
    status,
    mimeType,
    size,
    url: status === 'ready' ? getMediaUrl(key) : null,
  }
}

async function reject(media: Media, message: string): Promise<never> {
  await mediaRepository.markFailed(media.id, media.pageId)

  await mediaStorage.remove(media.key)

  throw new BadRequestError(message)
}

export const mediaService = {
  async presign(userId: string, { type, contentType, size }: PresignMediaBody) {
    assertStorageConfigured()

    const pageId = await getPageIdOrThrow(userId)

    if ((await mediaRepository.countPending(pageId)) >= env.MEDIA_MAX_PENDING_PER_PAGE) {
      throw new BadRequestError('Too many pending uploads, confirm or delete them first')
    }

    const id = randomUUID()

    const key = `pending/${pageId}/${id}`

    const media = await mediaRepository.create({
      id,
      pageId,
      key,
      type,
      mimeType: contentType,
      size,
    })

    if (!media) throw new Error('Failed to create media')

    const uploadUrl = await mediaStorage.presignPut(key, contentType, size)

    return { mediaId: id, uploadUrl, expiresIn: UPLOAD_EXPIRES_IN }
  },

  async confirm(userId: string, id: string) {
    assertStorageConfigured()

    const pageId = await getPageIdOrThrow(userId)

    const media = await getMediaOrThrow(id, pageId)

    if (media.status === 'ready') return toResponse(media)

    if (media.status === 'failed') {
      throw new ConflictError('Upload failed, request a new one')
    }

    const object = await mediaStorage.head(media.key)

    if (!object) {
      throw new BadRequestError('Upload not found')
    }

    if (object.size !== media.size || object.size > mediaMaxBytes[media.type]) {
      return reject(media, 'Uploaded file size does not match')
    }

    const detected = detectImageType(await mediaStorage.readHead(media.key))

    if (!detected || detected.mimeType !== media.mimeType) {
      return reject(media, 'Uploaded file is not a valid image')
    }

    const key = `media/${pageId}/${media.id}.${detected.extension}`

    await mediaStorage.copy(media.key, key, detected.mimeType)

    await mediaStorage.remove(media.key)

    const ready = await mediaRepository.markReady(media.id, pageId, {
      key,
      mimeType: detected.mimeType,
    })

    return toResponse(ready ?? (await getMediaOrThrow(id, pageId)))
  },

  async get(userId: string, id: string) {
    return toResponse(await getMediaOrThrow(id, await getPageIdOrThrow(userId)))
  },

  async delete(userId: string, id: string) {
    assertStorageConfigured()

    const page = await pagesRepository.findByUserId(userId)

    if (!page) {
      throw new NotFoundError('Page not found')
    }

    const media = await getMediaOrThrow(id, page.id)

    if (page.avatarMediaId === id || getBackgroundMediaId(page.appearance) === id) {
      throw new ConflictError('Media is in use, remove it from the page first')
    }

    await mediaService.discard(page.id, media.id)
  },

  async discard(pageId: string, id: string) {
    const media = await mediaRepository.findById(id, pageId)

    if (!media) return

    await mediaStorage.remove(media.key)

    await mediaRepository.delete(media.id, pageId)
  },
}
