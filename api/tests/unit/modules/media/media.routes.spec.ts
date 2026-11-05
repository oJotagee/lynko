import { afterEach, beforeEach, describe, expect, it, mock, spyOn } from 'bun:test'
import { randomUUID } from 'node:crypto'

import { mediaStorage } from '../../../../src/modules/media/media.storage'
import { mediaRateLimit } from '../../../../src/plugins/security'
import { createTestApp, signIn } from '../../support/app'
import { buildMedia } from '../../support/builders'
import { useInMemoryRepositories } from '../../support/memory-repositories'

describe('media routes', () => {
  let store: ReturnType<typeof useInMemoryRepositories>

  let app: Awaited<ReturnType<typeof createTestApp>>

  const upload = { type: 'avatar', fileName: 'eu.png', contentType: 'image/png', size: 1024 }

  beforeEach(async () => {
    store = useInMemoryRepositories()

    spyOn(mediaStorage, 'presignPut').mockResolvedValue('https://s3.test/upload')

    spyOn(mediaStorage, 'remove').mockResolvedValue()

    app = await createTestApp()
  })

  afterEach(async () => {
    await app.close()

    mock.restore()
  })

  it.each([
    ['POST', '/media/presign'],
    ['POST', `/media/${randomUUID()}/confirm`],
    ['GET', `/media/${randomUUID()}`],
    ['DELETE', `/media/${randomUUID()}`],
  ] as const)('%s %s requires authentication', async (method, url) => {
    const response = await app.inject({ method, url })

    expect(response.statusCode).toBe(401)
  })

  it('POST /media/presign returns the upload url', async () => {
    const { headers } = signIn(app, store)

    const response = await app.inject({
      method: 'POST',
      url: '/media/presign',
      headers,
      payload: upload,
    })

    expect(response.statusCode).toBe(201)

    expect(response.json()).toEqual({
      mediaId: store.media[0]?.id,
      uploadUrl: 'https://s3.test/upload',
      expiresIn: 300,
    })
  })

  it.each([
    ['an svg', { contentType: 'image/svg+xml' }],
    ['a gif', { contentType: 'image/gif' }],
    ['an avatar above the limit', { size: 5242881 }],
    ['a background above the limit', { type: 'background', size: 10485761 }],
    ['an empty file', { size: 0 }],
    ['an unknown type', { type: 'banner' }],
  ])('POST /media/presign rejects %s', async (_label, changes) => {
    const { headers } = signIn(app, store)

    const response = await app.inject({
      method: 'POST',
      url: '/media/presign',
      headers,
      payload: { ...upload, ...changes },
    })

    expect(response.statusCode).toBe(400)

    expect(store.media).toHaveLength(0)
  })

  it('POST /media/presign accepts a background up to its limit', async () => {
    const { headers } = signIn(app, store)

    const response = await app.inject({
      method: 'POST',
      url: '/media/presign',
      headers,
      payload: { ...upload, type: 'background', size: 10485760 },
    })

    expect(response.statusCode).toBe(201)
  })

  it('POST /media/presign returns 404 when the user has no page', async () => {
    const { headers } = signIn(app, store, { page: false })

    const response = await app.inject({
      method: 'POST',
      url: '/media/presign',
      headers,
      payload: upload,
    })

    expect(response.statusCode).toBe(404)
  })

  it('POST /media/presign is rate limited', async () => {
    const { headers } = signIn(app, store, { page: false })

    const request = { method: 'POST', url: '/media/presign', headers, payload: upload } as const

    for (let index = 0; index < mediaRateLimit.presign.max; index++) {
      expect((await app.inject(request)).statusCode).toBe(404)
    }

    expect((await app.inject(request)).statusCode).toBe(429)
  })

  it('GET /media/:id returns the own media', async () => {
    const { page, headers } = signIn(app, store)

    const media = buildMedia({ pageId: page?.id })

    store.media.push(media)

    const response = await app.inject({ method: 'GET', url: `/media/${media.id}`, headers })

    expect(response.statusCode).toBe(200)

    expect(response.json()).toMatchObject({ id: media.id, status: 'pending', url: null })
  })

  it('GET /media/:id returns 404 for a media of another page', async () => {
    const { headers } = signIn(app, store)

    const media = buildMedia()

    store.media.push(media)

    const response = await app.inject({ method: 'GET', url: `/media/${media.id}`, headers })

    expect(response.statusCode).toBe(404)
  })

  it('DELETE /media/:id deletes the own media', async () => {
    const { page, headers } = signIn(app, store)

    const media = buildMedia({ pageId: page?.id })

    store.media.push(media)

    const response = await app.inject({ method: 'DELETE', url: `/media/${media.id}`, headers })

    expect(response.statusCode).toBe(204)

    expect(store.media).toHaveLength(0)
  })

  it('rejects an id that is not a uuid', async () => {
    const { headers } = signIn(app, store)

    const response = await app.inject({ method: 'GET', url: '/media/abc', headers })

    expect(response.statusCode).toBe(400)
  })
})
