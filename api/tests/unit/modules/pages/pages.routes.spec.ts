import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'
import { defaultPageAppearance } from '../../../../src/modules/pages/pages.appearance'
import { createTestApp, signIn } from '../../support/app'
import { buildLink, buildPage } from '../../support/builders'
import { useInMemoryRepositories } from '../../support/memory-repositories'

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

  it('PATCH /pages/me persists socialLinks and preserves the other fields', async () => {
    const { page, headers } = signIn(app, store)

    const response = await app.inject({
      method: 'PATCH',
      url: '/pages/me',
      headers,
      payload: {
        socialLinks: [
          { platform: 'whatsapp', url: '+55 11 91234-5678', isActive: true },
          { platform: 'github', url: 'https://github.com/maria', isActive: false },
        ],
      },
    })

    const body = response.json()

    expect(response.statusCode).toBe(200)

    expect(body.socialLinks.map((item: { platform: string }) => item.platform)).toEqual([
      'whatsapp',
      'github',
    ])

    expect(body.socialLinks[0].url).toBe('https://wa.me/5511912345678')

    expect(body.title).toBe(page?.title)
  })

  it.each([
    ['javascript url', [{ platform: 'github', url: 'javascript:alert(1)', isActive: true }]],
    ['data url', [{ platform: 'github', url: 'data:text/html,x', isActive: true }]],
    [
      'duplicated platform',
      [
        { platform: 'github', url: 'https://github.com/a', isActive: true },
        { platform: 'github', url: 'https://github.com/b', isActive: true },
      ],
    ],
    [
      'more than 10 items',
      Array.from({ length: 11 }, () => ({
        platform: 'github',
        url: 'https://github.com/a',
        isActive: true,
      })),
    ],
  ])('PATCH /pages/me rejects socialLinks with %s', async (_case, socialLinks) => {
    const { headers } = signIn(app, store)

    const response = await app.inject({
      method: 'PATCH',
      url: '/pages/me',
      headers,
      payload: { socialLinks },
    })

    expect(response.statusCode).toBe(400)
  })

  it('PATCH /pages/me persists appearance and preserves the other fields', async () => {
    const { page, headers } = signIn(app, store)

    const appearance = {
      ...defaultPageAppearance,
      theme: 'gradient',
      background: { type: 'gradient', gradientFrom: '#000000', gradientTo: '#ffffff' },
    }

    const response = await app.inject({
      method: 'PATCH',
      url: '/pages/me',
      headers,
      payload: { appearance },
    })

    expect(response.statusCode).toBe(200)

    expect(response.json().appearance).toEqual(appearance)

    expect(response.json().title).toBe(page?.title)

    expect(response.json().theme).toEqual(page?.theme)
  })

  it.each([
    ['an invalid color', { typography: { fontFamily: 'inter', textColor: 'red' } }],
    ['a font outside the enum', { typography: { fontFamily: 'comic-sans', textColor: '#111111' } }],
    ['a background without its fields', { background: { type: 'image' } }],
  ])('PATCH /pages/me rejects appearance with %s', async (_case, override) => {
    const { headers } = signIn(app, store)

    const response = await app.inject({
      method: 'PATCH',
      url: '/pages/me',
      headers,
      payload: { appearance: { ...defaultPageAppearance, ...override } },
    })

    expect(response.statusCode).toBe(400)
  })

  it('GET /pages/me always returns a complete appearance', async () => {
    const { headers } = signIn(app, store)

    const response = await app.inject({ method: 'GET', url: '/pages/me', headers })

    expect(response.json().appearance).toMatchObject({ version: 1, theme: 'custom' })
  })

  it('GET /pages/:username exposes the appearance', async () => {
    store.pages.push(buildPage({ username: 'maria', isPublished: true }))

    const response = await app.inject({ method: 'GET', url: '/pages/maria' })

    expect(response.json().appearance).toMatchObject({ version: 1 })
  })

  it('PATCH /pages/me without a token returns 401', async () => {
    const response = await app.inject({
      method: 'PATCH',
      url: '/pages/me',
      payload: { socialLinks: [] },
    })

    expect(response.statusCode).toBe(401)
  })

  it('GET /pages/:username only exposes active social links', async () => {
    store.pages.push(
      buildPage({
        username: 'maria',
        isPublished: true,
        socialLinks: [
          { platform: 'x', url: 'https://x.com/maria', isActive: true },
          { platform: 'github', url: 'https://github.com/maria', isActive: false },
        ],
      }),
    )

    const response = await app.inject({ method: 'GET', url: '/pages/maria' })

    expect(response.json().socialLinks).toEqual([{ platform: 'x', url: 'https://x.com/maria' }])
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
    expect(response.json().id).toBe(page.id)

    expect(response.json()).not.toHaveProperty('userId')

    expect(response.json()).not.toHaveProperty('revision')

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
