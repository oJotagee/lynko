import { afterEach, beforeEach, describe, expect, it, mock, spyOn } from 'bun:test'
import { randomUUID } from 'node:crypto'
import { analyticsProducer } from '../../../../src/modules/analytics/analytics.queue'
import { createTestApp, signIn } from '../../support/app'
import { buildLink, buildPage } from '../../support/builders'
import { useInMemoryRepositories } from '../../support/memory-repositories'

const browser = { 'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) Firefox/130.0' }

describe('analytics routes', () => {
  let store: ReturnType<typeof useInMemoryRepositories>

  let app: Awaited<ReturnType<typeof createTestApp>>

  let enqueue: ReturnType<typeof spyOn<typeof analyticsProducer, 'enqueue'>>

  beforeEach(async () => {
    store = useInMemoryRepositories()

    enqueue = spyOn(analyticsProducer, 'enqueue').mockResolvedValue(undefined)

    app = await createTestApp()
  })

  afterEach(async () => {
    await app.close()

    mock.restore()
  })

  function publish(overrides: Parameters<typeof buildPage>[0] = {}) {
    const page = buildPage({ isPublished: true, ...overrides })

    store.pages.push(page)

    return page
  }

  describe('POST /analytics/views', () => {
    it('enqueues a view for a published page', async () => {
      const page = publish()

      const eventId = randomUUID()

      const response = await app.inject({
        method: 'POST',
        url: '/analytics/views',
        headers: browser,
        payload: { pageId: page.id, eventId },
      })

      expect(response.statusCode).toBe(202)
      expect(enqueue).toHaveBeenCalledTimes(1)
      expect(enqueue.mock.calls[0]?.[0]).toMatchObject({ type: 'view', pageId: page.id, eventId })
    })

    it('answers 404 for an unknown page', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/analytics/views',
        headers: browser,
        payload: { pageId: randomUUID(), eventId: randomUUID() },
      })

      expect(response.statusCode).toBe(404)
      expect(enqueue).not.toHaveBeenCalled()
    })

    it('answers 404 for an unpublished page', async () => {
      const page = publish({ isPublished: false })

      const response = await app.inject({
        method: 'POST',
        url: '/analytics/views',
        headers: browser,
        payload: { pageId: page.id, eventId: randomUUID() },
      })

      expect(response.statusCode).toBe(404)
      expect(enqueue).not.toHaveBeenCalled()
    })

    it('rejects an invalid eventId', async () => {
      const page = publish()

      const response = await app.inject({
        method: 'POST',
        url: '/analytics/views',
        headers: browser,
        payload: { pageId: page.id, eventId: 'not-a-uuid' },
      })

      expect(response.statusCode).toBe(400)
      expect(enqueue).not.toHaveBeenCalled()
    })

    it.each([
      ['a crawler', { 'user-agent': 'Googlebot/2.1' }],
      ['a link preview', { 'user-agent': 'Slack-LinkPreview' }],
      ['an empty user agent', { 'user-agent': '' }],
    ])('answers 202 without enqueuing for %s', async (_case, headers) => {
      const page = publish()

      const response = await app.inject({
        method: 'POST',
        url: '/analytics/views',
        headers,
        payload: { pageId: page.id, eventId: randomUUID() },
      })

      expect(response.statusCode).toBe(202)
      expect(enqueue).not.toHaveBeenCalled()
    })

    it('stays 202 when the queue fails', async () => {
      const page = publish()

      enqueue.mockRejectedValue(new Error('redis down'))

      const response = await app.inject({
        method: 'POST',
        url: '/analytics/views',
        headers: browser,
        payload: { pageId: page.id, eventId: randomUUID() },
      })

      expect(response.statusCode).toBe(202)
    })

    it('limits to 30 requests per minute', async () => {
      const page = publish()

      const statuses: number[] = []

      for (let index = 0; index < 31; index += 1) {
        const response = await app.inject({
          method: 'POST',
          url: '/analytics/views',
          headers: browser,
          payload: { pageId: page.id, eventId: randomUUID() },
        })

        statuses.push(response.statusCode)
      }

      expect(statuses.slice(0, 30).every((status) => status === 202)).toBe(true)
      expect(statuses[30]).toBe(429)
    })
  })

  describe('GET /r/:linkId', () => {
    function seedLink(overrides: Parameters<typeof buildLink>[0] = {}, published = true) {
      const page = publish({ isPublished: published })

      const link = buildLink({
        pageId: page.id,
        url: 'https://example.com/portfolio',
        ...overrides,
      })

      store.links.push(link)

      return { page, link }
    }

    it('redirects to the stored url, no-store, and enqueues a click', async () => {
      const { page, link } = seedLink()

      const response = await app.inject({ method: 'GET', url: `/r/${link.id}`, headers: browser })

      expect(response.statusCode).toBe(302)
      expect(response.headers.location).toBe('https://example.com/portfolio')
      expect(response.headers['cache-control']).toBe('no-store')
      expect(enqueue.mock.calls[0]?.[0]).toMatchObject({
        type: 'link_click',
        pageId: page.id,
        linkId: link.id,
      })
    })

    it('ignores the query string when picking the destination', async () => {
      const { link } = seedLink()

      const response = await app.inject({
        method: 'GET',
        url: `/r/${link.id}?url=https://evil.example&redirect=//evil.example`,
        headers: browser,
      })

      expect(response.headers.location).toBe('https://example.com/portfolio')
    })

    it('answers 404 for an inactive link', async () => {
      const { link } = seedLink({ isActive: false })

      const response = await app.inject({ method: 'GET', url: `/r/${link.id}`, headers: browser })

      expect(response.statusCode).toBe(404)
      expect(enqueue).not.toHaveBeenCalled()
    })

    it('answers 404 for a link of an unpublished page', async () => {
      const { link } = seedLink({}, false)

      const response = await app.inject({ method: 'GET', url: `/r/${link.id}`, headers: browser })

      expect(response.statusCode).toBe(404)
    })

    it('answers 404 for an unknown link and 400 for a malformed id', async () => {
      const unknown = await app.inject({ method: 'GET', url: `/r/${randomUUID()}` })

      const malformed = await app.inject({ method: 'GET', url: '/r/abc' })

      expect(unknown.statusCode).toBe(404)
      expect(malformed.statusCode).toBe(400)
    })

    it('does not enqueue a bot click but still redirects', async () => {
      const { link } = seedLink()

      const response = await app.inject({
        method: 'GET',
        url: `/r/${link.id}`,
        headers: { 'user-agent': 'facebookexternalhit/1.1' },
      })

      expect(response.statusCode).toBe(302)
      expect(enqueue).not.toHaveBeenCalled()
    })

    it('keeps the redirect when the queue rejects', async () => {
      const { link } = seedLink()

      enqueue.mockRejectedValue(new Error('redis down'))

      const response = await app.inject({ method: 'GET', url: `/r/${link.id}`, headers: browser })

      expect(response.statusCode).toBe(302)
      expect(response.headers.location).toBe('https://example.com/portfolio')
    })

    it('refuses a stored url that is not http or https', async () => {
      const { link } = seedLink({ url: 'javascript:alert(1)' })

      const response = await app.inject({ method: 'GET', url: `/r/${link.id}`, headers: browser })

      expect(response.statusCode).toBe(404)
    })
  })

  describe('GET /r/social/:pageId/:platform', () => {
    function seedPage(overrides: Parameters<typeof buildPage>[0] = {}) {
      return publish({
        socialLinks: [
          { platform: 'instagram', url: 'https://instagram.com/maria', isActive: true },
          { platform: 'github', url: 'https://github.com/maria', isActive: false },
        ],
        ...overrides,
      })
    }

    it('redirects to the active social url and enqueues a click', async () => {
      const page = seedPage()

      const response = await app.inject({
        method: 'GET',
        url: `/r/social/${page.id}/instagram`,
        headers: browser,
      })

      expect(response.statusCode).toBe(302)
      expect(response.headers.location).toBe('https://instagram.com/maria')
      expect(response.headers['cache-control']).toBe('no-store')
      expect(enqueue.mock.calls[0]?.[0]).toMatchObject({
        type: 'social_click',
        pageId: page.id,
        platform: 'instagram',
      })
    })

    it('answers 404 for an inactive or missing platform', async () => {
      const page = seedPage()

      const inactive = await app.inject({
        method: 'GET',
        url: `/r/social/${page.id}/github`,
        headers: browser,
      })

      const missing = await app.inject({
        method: 'GET',
        url: `/r/social/${page.id}/youtube`,
        headers: browser,
      })

      expect(inactive.statusCode).toBe(404)
      expect(missing.statusCode).toBe(404)
      expect(enqueue).not.toHaveBeenCalled()
    })

    it('answers 400 for an unknown platform', async () => {
      const page = seedPage()

      const response = await app.inject({
        method: 'GET',
        url: `/r/social/${page.id}/myspace`,
        headers: browser,
      })

      expect(response.statusCode).toBe(400)
    })

    it('answers 404 for an unpublished page', async () => {
      const page = seedPage({ isPublished: false })

      const response = await app.inject({
        method: 'GET',
        url: `/r/social/${page.id}/instagram`,
        headers: browser,
      })

      expect(response.statusCode).toBe(404)
    })

    it('keeps the redirect when the queue rejects', async () => {
      const page = seedPage()

      enqueue.mockRejectedValue(new Error('redis down'))

      const response = await app.inject({
        method: 'GET',
        url: `/r/social/${page.id}/instagram`,
        headers: browser,
      })

      expect(response.statusCode).toBe(302)
    })
  })

  describe('GET /analytics reports', () => {
    const paths = ['overview', 'timeseries', 'links', 'social']

    it.each(paths)('GET /analytics/%s answers 401 without a token', async (path) => {
      const response = await app.inject({ method: 'GET', url: `/analytics/${path}` })

      expect(response.statusCode).toBe(401)
    })

    it.each(paths)('GET /analytics/%s answers 404 for a user without a page', async (path) => {
      const { headers } = signIn(app, store, { page: false })

      const response = await app.inject({ method: 'GET', url: `/analytics/${path}`, headers })

      expect(response.statusCode).toBe(404)
    })

    it.each(paths)('GET /analytics/%s rejects an invalid period', async (path) => {
      const { headers } = signIn(app, store)

      const response = await app.inject({
        method: 'GET',
        url: `/analytics/${path}?period=365d`,
        headers,
      })

      expect(response.statusCode).toBe(400)
    })

    it('ignores a pageId in the query and reports the own page only', async () => {
      const { headers, page } = signIn(app, store)

      const other = publish()

      const today = new Date().toISOString().slice(0, 10)

      store.analytics.views.push({ pageId: page?.id ?? '', date: today, count: 2 })
      store.analytics.views.push({ pageId: other.id, date: today, count: 900 })

      const response = await app.inject({
        method: 'GET',
        url: `/analytics/overview?pageId=${other.id}`,
        headers,
      })

      expect(response.statusCode).toBe(200)
      expect(response.json().pageViews).toBe(2)
    })

    it('defaults to 7 days', async () => {
      const { headers } = signIn(app, store)

      const response = await app.inject({ method: 'GET', url: '/analytics/timeseries', headers })

      expect(response.json()).toHaveLength(7)
    })
  })
})
