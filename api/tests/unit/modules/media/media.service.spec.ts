import { afterEach, beforeEach, describe, expect, it, mock, spyOn } from 'bun:test'

import { env } from '../../../../src/config/env'
import { mediaService } from '../../../../src/modules/media/media.service'
import { mediaStorage } from '../../../../src/modules/media/media.storage'
import { defaultPageAppearance } from '../../../../src/modules/pages/pages.appearance'
import { buildMedia, buildPage, type Media, type Page } from '../../support/builders'
import { useInMemoryRepositories } from '../../support/memory-repositories'

const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0])

const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0])

const WEBP = new Uint8Array([0x52, 0x49, 0x46, 0x46, 1, 2, 3, 4, 0x57, 0x45, 0x42, 0x50])

const SVG = new TextEncoder().encode('<svg xmlns="h')

describe('mediaService', () => {
  let store: ReturnType<typeof useInMemoryRepositories>

  let page: Page

  let storage: {
    presignPut: ReturnType<typeof spyOn>
    head: ReturnType<typeof spyOn>
    readHead: ReturnType<typeof spyOn>
    copy: ReturnType<typeof spyOn>
    remove: ReturnType<typeof spyOn>
  }

  const userId = 'a26d7946-6249-4f68-95e6-5cb612ccf538'

  const upload = {
    type: 'avatar',
    fileName: 'eu.png',
    contentType: 'image/png',
    size: 1024,
  } as const

  beforeEach(() => {
    store = useInMemoryRepositories()

    page = buildPage({ userId })

    store.pages.push(page)

    storage = {
      presignPut: spyOn(mediaStorage, 'presignPut').mockResolvedValue('https://s3.test/upload'),
      head: spyOn(mediaStorage, 'head').mockResolvedValue({ size: 1024 }),
      readHead: spyOn(mediaStorage, 'readHead').mockResolvedValue(PNG),
      copy: spyOn(mediaStorage, 'copy').mockResolvedValue(),
      remove: spyOn(mediaStorage, 'remove').mockResolvedValue(),
    }
  })

  afterEach(() => {
    mock.restore()
  })

  describe('presign', () => {
    it('creates a pending media with a server generated key', async () => {
      const result = await mediaService.presign(userId, { ...upload, fileName: '../../etc.png' })

      const [media] = store.media

      expect(result).toMatchObject({ uploadUrl: 'https://s3.test/upload', expiresIn: 300 })

      expect(media?.id).toBe(result.mediaId)

      expect(media).toMatchObject({
        pageId: page.id,
        key: `pending/${page.id}/${media?.id}`,
        status: 'pending',
        mimeType: 'image/png',
        size: 1024,
      })

      expect(storage.presignPut).toHaveBeenCalledWith(media?.key, 'image/png', 1024)
    })

    it('throws NotFoundError when the user has no page', async () => {
      store.pages = []

      await expect(mediaService.presign(userId, upload)).rejects.toThrow('Page not found')
    })

    it('limits the pending uploads per page', async () => {
      for (let index = 0; index < env.MEDIA_MAX_PENDING_PER_PAGE; index++) {
        store.media.push(buildMedia({ pageId: page.id }))
      }

      await expect(mediaService.presign(userId, upload)).rejects.toThrow('Too many pending uploads')

      expect(storage.presignPut).not.toHaveBeenCalled()
    })

    it('throws ServiceUnavailableError when the storage is not configured', async () => {
      const bucket = env.S3_BUCKET

      env.S3_BUCKET = undefined

      try {
        await expect(mediaService.presign(userId, upload)).rejects.toMatchObject({
          statusCode: 503,
        })
      } finally {
        env.S3_BUCKET = bucket
      }

      expect(store.media).toHaveLength(0)
    })
  })

  describe('confirm', () => {
    it.each([
      ['image/png', PNG, 'png'],
      ['image/jpeg', JPEG, 'jpg'],
      ['image/webp', WEBP, 'webp'],
    ] as const)('publishes a valid %s under media/', async (mimeType, head, extension) => {
      const media = buildMedia({ pageId: page.id, mimeType })

      store.media.push(media)

      storage.readHead.mockResolvedValue(head)

      const result = await mediaService.confirm(userId, media.id)

      const key = `media/${page.id}/${media.id}.${extension}`

      expect(result).toMatchObject({
        id: media.id,
        status: 'ready',
        mimeType,
        url: `https://cdn.lynko.test/${key}`,
      })

      expect(storage.copy).toHaveBeenCalledWith(`pending/${page.id}/${media.id}`, key, mimeType)

      expect(storage.remove).toHaveBeenCalledWith(`pending/${page.id}/${media.id}`)
    })

    it('is idempotent for a ready media', async () => {
      const media = buildMedia({ pageId: page.id, status: 'ready', key: 'media/x/y.png' })

      store.media.push(media)

      const result = await mediaService.confirm(userId, media.id)

      expect(result).toMatchObject({ status: 'ready', url: 'https://cdn.lynko.test/media/x/y.png' })

      expect(storage.head).not.toHaveBeenCalled()

      expect(storage.copy).not.toHaveBeenCalled()
    })

    it('rejects and removes a file whose size does not match', async () => {
      const media = buildMedia({ pageId: page.id })

      store.media.push(media)

      storage.head.mockResolvedValue({ size: 999_999 })

      await expect(mediaService.confirm(userId, media.id)).rejects.toThrow('size does not match')

      expect(media.status).toBe('failed')

      expect(storage.remove).toHaveBeenCalledWith(media.key)

      expect(storage.copy).not.toHaveBeenCalled()
    })

    it.each([
      ['a different image type', JPEG],
      ['an svg', SVG],
    ])('rejects and removes %s', async (_label, head) => {
      const media = buildMedia({ pageId: page.id, mimeType: 'image/png' })

      store.media.push(media)

      storage.readHead.mockResolvedValue(head)

      await expect(mediaService.confirm(userId, media.id)).rejects.toThrow('not a valid image')

      expect(media.status).toBe('failed')

      expect(storage.remove).toHaveBeenCalledWith(media.key)

      expect(storage.copy).not.toHaveBeenCalled()
    })

    it('keeps the media pending when the upload is missing', async () => {
      const media = buildMedia({ pageId: page.id })

      store.media.push(media)

      storage.head.mockResolvedValue(null)

      await expect(mediaService.confirm(userId, media.id)).rejects.toThrow('Upload not found')

      expect(media.status).toBe('pending')
    })

    it('throws ConflictError for a failed media', async () => {
      const media = buildMedia({ pageId: page.id, status: 'failed' })

      store.media.push(media)

      await expect(mediaService.confirm(userId, media.id)).rejects.toMatchObject({
        statusCode: 409,
      })
    })

    it('throws NotFoundError for a media of another page', async () => {
      const media = buildMedia({ pageId: buildPage().id })

      store.media.push(media)

      await expect(mediaService.confirm(userId, media.id)).rejects.toThrow('Media not found')

      expect(storage.head).not.toHaveBeenCalled()
    })
  })

  describe('get', () => {
    it('returns the media without url while pending', async () => {
      const media = buildMedia({ pageId: page.id })

      store.media.push(media)

      expect(await mediaService.get(userId, media.id)).toEqual({
        id: media.id,
        type: 'avatar',
        status: 'pending',
        mimeType: 'image/png',
        size: 1024,
        url: null,
      })
    })

    it('throws NotFoundError for a media of another page', async () => {
      const media = buildMedia({ pageId: buildPage().id })

      store.media.push(media)

      await expect(mediaService.get(userId, media.id)).rejects.toThrow('Media not found')
    })
  })

  describe('delete', () => {
    it('removes the object and the row', async () => {
      const media = buildMedia({ pageId: page.id })

      store.media.push(media)

      await mediaService.delete(userId, media.id)

      expect(storage.remove).toHaveBeenCalledWith(media.key)

      expect(store.media).toHaveLength(0)
    })

    it.each([
      ['as avatar', (media: Media) => Object.assign(page, { avatarMediaId: media.id })],
      [
        'as background',
        (media: Media) =>
          Object.assign(page, {
            appearance: {
              ...defaultPageAppearance,
              background: { type: 'image', imageMediaId: media.id },
            },
          }),
      ],
    ])('throws ConflictError when the media is in use %s', async (_label, use) => {
      const media = buildMedia({ pageId: page.id, status: 'ready' })

      store.media.push(media)

      use(media)

      await expect(mediaService.delete(userId, media.id)).rejects.toMatchObject({
        statusCode: 409,
      })

      expect(storage.remove).not.toHaveBeenCalled()

      expect(store.media).toHaveLength(1)
    })

    it('throws NotFoundError for a media of another page', async () => {
      const media = buildMedia({ pageId: buildPage().id })

      store.media.push(media)

      await expect(mediaService.delete(userId, media.id)).rejects.toThrow('Media not found')

      expect(storage.remove).not.toHaveBeenCalled()

      expect(store.media).toHaveLength(1)
    })
  })
})
