import { afterEach, beforeEach, describe, expect, it, mock, spyOn } from 'bun:test'
import { defaultPageAppearance } from '../../../../src/modules/pages/pages.appearance'
import type { PublicPage } from '../../../../src/modules/pages/pages.cache'
import { pagesService, publicPageCache } from '../../../../src/modules/pages/pages.service'
import { defaultPageTheme } from '../../../../src/modules/pages/pages.theme'
import { createTestApp, signIn } from '../../support/app'
import { buildSubscription } from '../../support/builders'
import { useInMemoryRepositories } from '../../support/memory-repositories'

const DAY = 24 * 60 * 60 * 1000

describe('Lynko branding', () => {
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

  function hideBranding(headers: Record<string, string>) {
    return app.inject({
      method: 'PATCH',
      url: '/pages/me',
      headers,
      payload: { showBranding: false },
    })
  }

  it('starts visible on every page', async () => {
    const { headers } = signIn(app, store)

    const response = await app.inject({ method: 'GET', url: '/pages/me', headers })

    expect(response.json().showBranding).toBe(true)
  })

  it('lets only Pro hide the branding', async () => {
    const { user, page, headers } = signIn(app, store)

    const free = await hideBranding(headers)

    expect(free.statusCode).toBe(403)
    expect(free.json()).toEqual({ message: 'Pro plan required' })
    expect(page?.showBranding).toBe(true)

    store.subscriptions.push(buildSubscription({ userId: user.id }))

    const pro = await hideBranding(headers)

    expect(pro.statusCode).toBe(200)
    expect(pro.json().showBranding).toBe(false)
  })

  it('always lets the branding be shown again', async () => {
    const { headers } = signIn(app, store, { page: { showBranding: false } })

    const response = await app.inject({
      method: 'PATCH',
      url: '/pages/me',
      headers,
      payload: { showBranding: true },
    })

    expect(response.statusCode).toBe(200)
  })

  it('hides the branding on the public page of a Pro owner without exposing the plan', async () => {
    const { user } = signIn(app, store, {
      page: { username: 'maria', isPublished: true, showBranding: false },
    })

    store.subscriptions.push(buildSubscription({ userId: user.id }))

    const response = await app.inject({ method: 'GET', url: '/pages/maria' })

    expect(response.statusCode).toBe(200)
    expect(response.json().showBranding).toBe(false)
    expect(response.json()).not.toHaveProperty('proAccessUntil')
  })

  it('shows the branding again when Pro ends, even for a cached page', async () => {
    const cached: PublicPage = {
      id: crypto.randomUUID(),
      username: 'maria',
      title: 'Maria',
      bio: null,
      avatarUrl: null,
      backgroundImageUrl: null,
      theme: defaultPageTheme,
      appearance: defaultPageAppearance,
      showBranding: false,
      socialLinks: [],
      links: [],
      proAccessUntil: new Date(Date.now() - DAY),
    }

    spyOn(publicPageCache, 'get').mockResolvedValue(cached)

    const page = await pagesService.getPublic('maria')

    expect(page.showBranding).toBe(true)
    expect(page).not.toHaveProperty('proAccessUntil')

    spyOn(publicPageCache, 'get').mockResolvedValue({
      ...cached,
      proAccessUntil: new Date(Date.now() + DAY),
    })

    expect((await pagesService.getPublic('maria')).showBranding).toBe(false)
  })

  it('shows the branding in the dashboard preview after Pro ends', async () => {
    const { user } = signIn(app, store, { page: { showBranding: false } })

    store.subscriptions.push(
      buildSubscription({
        userId: user.id,
        status: 'cancelled',
        currentPeriodEnd: new Date(Date.now() - DAY),
      }),
    )

    const preview = await pagesService.getPreview(user.id)

    expect(preview.showBranding).toBe(true)
  })
})
