import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'

import { useInMemoryRepositories } from '../../support/memory-repositories'
import { buildLink, buildPage } from '../../support/builders'
import { createTestApp, signIn } from '../../support/app'

describe('links routes', () => {
  let store: ReturnType<typeof useInMemoryRepositories>

  let app: Awaited<ReturnType<typeof createTestApp>>

  beforeEach(async () => {
    store = useInMemoryRepositories()

    app = await createTestApp()
  })

  afterEach(async () => {
    await app.close()

    mock.restore()
  })

  it('requires authentication', async () => {
    const response = await app.inject({ method: 'GET', url: '/links' })

    expect(response.statusCode).toBe(401)
  })

  it('GET /links lists only the links of the own page, in order', async () => {
    const { page, headers } = signIn(app, store)

    store.links.push(
      buildLink({ pageId: page?.id, title: 'Segundo', position: 1 }),
      buildLink({ pageId: page?.id, title: 'Primeiro', position: 0 }),
      buildLink({ pageId: buildPage().id, title: 'Alheio' }),
    )

    const response = await app.inject({ method: 'GET', url: '/links', headers })

    expect(response.statusCode).toBe(200)

    expect(response.json().map((link: { title: string }) => link.title)).toEqual([
      'Primeiro',
      'Segundo',
    ])
  })

  it('POST /links creates a link', async () => {
    const { headers } = signIn(app, store)

    const response = await app.inject({
      method: 'POST',
      url: '/links',
      headers,
      payload: { title: 'Blog', url: 'https://blog.dev' },
    })

    expect(response.statusCode).toBe(201)
    expect(response.json()).toMatchObject({ title: 'Blog', position: 0, isActive: true })
  })

  it.each(['javascript:alert(1)', 'ftp://files.dev', 'not a url'])(
    'POST /links rejects the url %s',
    async (url) => {
      const { headers } = signIn(app, store)

      const response = await app.inject({
        method: 'POST',
        url: '/links',
        headers,
        payload: { title: 'Blog', url },
      })

      expect(response.statusCode).toBe(400)
      expect(store.links).toHaveLength(0)
    },
  )

  it('POST /links returns 404 when the user has no page', async () => {
    const { headers } = signIn(app, store, { page: false })

    const response = await app.inject({
      method: 'POST',
      url: '/links',
      headers,
      payload: { title: 'Blog', url: 'https://blog.dev' },
    })

    expect(response.statusCode).toBe(404)
  })

  it('PATCH and DELETE answer 404 for a link of another user', async () => {
    const { headers } = signIn(app, store)

    const foreign = buildLink({ pageId: buildPage().id })

    store.links.push(foreign)

    const patch = await app.inject({
      method: 'PATCH',
      url: `/links/${foreign.id}`,
      headers,
      payload: { title: 'Hack' },
    })

    const remove = await app.inject({ method: 'DELETE', url: `/links/${foreign.id}`, headers })

    expect(patch.statusCode).toBe(404)
    expect(remove.statusCode).toBe(404)
    expect(foreign.title).toBe('Portfólio')
  })

  it('PATCH /links/:id rejects an invalid id', async () => {
    const { headers } = signIn(app, store)

    const response = await app.inject({
      method: 'PATCH',
      url: '/links/not-a-uuid',
      headers,
      payload: { isActive: false },
    })

    expect(response.statusCode).toBe(400)
  })

  it('DELETE /links/:id removes the link', async () => {
    const { page, headers } = signIn(app, store)

    const link = buildLink({ pageId: page?.id })

    store.links.push(link)

    const response = await app.inject({ method: 'DELETE', url: `/links/${link.id}`, headers })

    expect(response.statusCode).toBe(204)
    expect(store.links).toHaveLength(0)
  })

  it('PUT /links/reorder saves the order and returns 400 for an incomplete list', async () => {
    const { page, headers } = signIn(app, store)

    const first = buildLink({ pageId: page?.id, position: 0 })

    const second = buildLink({ pageId: page?.id, position: 1 })

    store.links.push(first, second)

    const reordered = await app.inject({
      method: 'PUT',
      url: '/links/reorder',
      headers,
      payload: { linkIds: [second.id, first.id] },
    })

    const incomplete = await app.inject({
      method: 'PUT',
      url: '/links/reorder',
      headers,
      payload: { linkIds: [first.id] },
    })

    expect(reordered.statusCode).toBe(200)
    expect(reordered.json().map((link: { id: string }) => link.id)).toEqual([second.id, first.id])
    expect(incomplete.statusCode).toBe(400)
  })
})
