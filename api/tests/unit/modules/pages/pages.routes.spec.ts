import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'

import { useInMemoryRepositories } from '../../support/memory-repositories'
import { buildLink, buildPage } from '../../support/builders'
import { createTestApp, signIn } from '../../support/app'

describe('pages routes', () => {
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

  it('POST /pages creates the page with the default theme', async () => {
    const { headers } = signIn(app, store, { page: false })

    const response = await app.inject({
      method: 'POST',
      url: '/pages',
      headers,
      payload: { username: 'Maria_Silva', title: 'Maria' },
    })

    expect(response.statusCode).toBe(201)
    expect(response.json()).toMatchObject({ username: 'maria_silva', isPublished: false })
    expect(response.json().theme.buttonStyle).toBe('filled')
  })

  it.each([
    ['reserved', 'dashboard'],
    ['too short', 'ab'],
    ['with invalid characters', 'maria-silva'],
  ])('POST /pages rejects a %s username', async (_case, username) => {
    const { headers } = signIn(app, store, { page: false })

    const response = await app.inject({
      method: 'POST',
      url: '/pages',
      headers,
      payload: { username, title: 'Maria' },
    })

    expect(response.statusCode).toBe(400)
  })

  it('POST /pages rejects an avatar that is not http or https', async () => {
    const { headers } = signIn(app, store, { page: false })

    const response = await app.inject({
      method: 'POST',
      url: '/pages',
      headers,
      payload: { username: 'maria', title: 'Maria', avatarUrl: 'javascript:alert(1)' },
    })

    expect(response.statusCode).toBe(400)
  })

  it('PATCH /pages/me rejects an empty body', async () => {
    const { headers } = signIn(app, store)

    const response = await app.inject({ method: 'PATCH', url: '/pages/me', headers, payload: {} })

    expect(response.statusCode).toBe(400)
  })

  it('PATCH /pages/me publishes the page of the token owner only', async () => {
    const other = buildPage({ username: 'joao' })
    store.pages.push(other)
    const { page, headers } = signIn(app, store)

    const response = await app.inject({
      method: 'PATCH',
      url: '/pages/me',
      headers,
      payload: { isPublished: true },
    })

    expect(response.statusCode).toBe(200)
    expect(page?.isPublished).toBe(true)
    expect(other.isPublished).toBe(false)
  })

  it('GET /pages/me returns 404 when the user has no page', async () => {
    const { headers } = signIn(app, store, { page: false })

    const response = await app.inject({ method: 'GET', url: '/pages/me', headers })

    expect(response.statusCode).toBe(404)
    expect(response.json()).toEqual({ message: 'Page not found' })
  })

  it('GET /pages/:username is public and only exposes active links', async () => {
    const page = buildPage({ username: 'maria', isPublished: true })
    store.pages.push(page)
    store.links.push(
      buildLink({ pageId: page.id, title: 'Visível' }),
      buildLink({ pageId: page.id, title: 'Oculto', isActive: false, position: 1 }),
    )

    const response = await app.inject({ method: 'GET', url: '/pages/MARIA' })

    expect(response.statusCode).toBe(200)
    expect(response.json()).not.toHaveProperty('id')
    expect(response.json().links).toEqual([
      expect.objectContaining({ title: 'Visível', url: 'https://example.com' }),
    ])
  })

  it('GET /pages/:username returns 404 for an unpublished page', async () => {
    store.pages.push(buildPage({ username: 'maria', isPublished: false }))

    const response = await app.inject({ method: 'GET', url: '/pages/maria' })

    expect(response.statusCode).toBe(404)
  })
})
