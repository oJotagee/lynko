import { afterEach, beforeEach, describe, expect, it, mock, spyOn } from 'bun:test'
import { env } from '../../../../src/config/env'
import { type DomainOwner, resolveCache } from '../../../../src/modules/domains/domains.cache'
import { ownershipDns } from '../../../../src/modules/domains/domains.dns'
import { processDomainsJob } from '../../../../src/modules/domains/domains.queue'
import { domainsService } from '../../../../src/modules/domains/domains.service'
import { createTestApp, signIn } from '../../support/app'
import { buildCustomDomain, buildSubscription } from '../../support/builders'
import { useInMemoryRepositories } from '../../support/memory-repositories'

const MINUTE = 60 * 1000

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

function mockVercelLive() {
  return spyOn(globalThis, 'fetch').mockImplementation((async (input: string | URL) => {
    const url = new URL(String(input))

    if (url.pathname.endsWith('/config')) {
      return jsonResponse({ misconfigured: false, recommendedIPv4: [], recommendedCNAME: [] })
    }

    const name = url.pathname.split('/').at(-1) ?? ''

    return jsonResponse({ name, verified: true, verification: [] })
  }) as typeof fetch)
}

describe('custom domain resolve, job and page', () => {
  let store: ReturnType<typeof useInMemoryRepositories>

  let app: Awaited<ReturnType<typeof createTestApp>>

  let cache: Map<string, DomainOwner | null>

  const original = { ...env }

  beforeEach(async () => {
    store = useInMemoryRepositories()

    app = await createTestApp()

    Object.assign(env, { VERCEL_API_TOKEN: 'vercel-test-token', VERCEL_PROJECT_ID: 'prj_123' })

    domainsService.resetRoutingCache()

    cache = new Map()

    spyOn(resolveCache, 'read').mockImplementation(async (hostname) => cache.get(hostname))

    spyOn(resolveCache, 'write').mockImplementation(async (hostname, owner) => {
      cache.set(hostname, owner)
    })

    spyOn(resolveCache, 'invalidate').mockImplementation(async (hostname) => {
      cache.delete(hostname)
    })

    spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(async () => {
    Object.assign(env, original)

    await app.close()

    mock.restore()
  })

  function owner(pro: boolean, status: 'active' | 'pending_dns' = 'active') {
    const session = signIn(app, store, { page: { username: 'maria' } })

    if (pro) store.subscriptions.push(buildSubscription({ userId: session.user.id }))

    store.customDomains.push(
      buildCustomDomain({
        userId: session.user.id,
        status,
        ownerVerifiedAt: new Date(),
        lastCheckedAt: new Date(),
      }),
    )

    return session
  }

  async function resolve(host: string) {
    return app.inject({
      method: 'GET',
      url: `/domains/resolve?host=${encodeURIComponent(host)}`,
    })
  }

  describe('GET /domains/resolve', () => {
    it('returns the username and the plan of a live domain without auth', async () => {
      owner(true)

      const response = await resolve('seunome.com')

      expect(response.statusCode).toBe(200)

      expect(response.json()).toEqual({ username: 'maria', pro: true })
    })

    it('reports pro false when the plan ended', async () => {
      owner(false)

      expect((await resolve('seunome.com')).json()).toEqual({ username: 'maria', pro: false })
    })

    it('normalizes the host', async () => {
      owner(true)

      expect((await resolve('WWW.SeuNome.com.:443')).json().username).toBe('maria')
    })

    it('answers 404 for pending and unknown domains', async () => {
      owner(true, 'pending_dns')

      expect((await resolve('seunome.com')).statusCode).toBe(404)

      expect((await resolve('outro.com')).statusCode).toBe(404)

      expect((await resolve('not a host')).statusCode).toBe(404)
    })

    it('caches the owner and the misses', async () => {
      const { user } = owner(true)

      await resolve('seunome.com')

      await resolve('outro.com')

      expect(cache.get('seunome.com')).toEqual({ userId: user.id, username: 'maria' })

      expect(cache.get('outro.com')).toBeNull()

      store.customDomains = []

      expect((await resolve('seunome.com')).statusCode).toBe(200)
    })

    it('clears the cache when the domain is removed', async () => {
      mockVercelLive()

      const { headers } = owner(true)

      await resolve('seunome.com')

      await app.inject({ method: 'DELETE', url: '/domains/me', headers })

      expect(cache.has('seunome.com')).toBe(false)

      expect((await resolve('seunome.com')).statusCode).toBe(404)
    })

    it('clears the cache when the username changes', async () => {
      const { headers } = owner(true)

      await resolve('seunome.com')

      const patch = await app.inject({
        method: 'PATCH',
        url: '/pages/me',
        headers,
        payload: { username: 'marianova' },
      })

      expect(patch.statusCode).toBe(200)

      expect((await resolve('seunome.com')).json().username).toBe('marianova')
    })
  })

  describe('check job', () => {
    it('checks only the domains that are due', async () => {
      mockVercelLive()

      spyOn(ownershipDns, 'hasToken').mockResolvedValue(true)

      const now = new Date()

      const at = (minutesAgo: number) => new Date(now.getTime() - minutesAgo * MINUTE)

      store.customDomains.push(
        buildCustomDomain({ hostname: 'fresh.com', lastCheckedAt: at(1) }),
        buildCustomDomain({ hostname: 'new.com', lastCheckedAt: null }),
        buildCustomDomain({
          hostname: 'stale.com',
          status: 'pending_dns',
          ownerVerifiedAt: at(60),
          lastCheckedAt: at(10),
        }),
        buildCustomDomain({
          hostname: 'live.com',
          status: 'active',
          ownerVerifiedAt: at(60),
          lastCheckedAt: at(60),
        }),
        buildCustomDomain({
          hostname: 'old-live.com',
          status: 'active',
          ownerVerifiedAt: at(3000),
          lastCheckedAt: at(25 * 60),
        }),
        buildCustomDomain({ hostname: 'broken.com', status: 'error', lastCheckedAt: at(60) }),
      )

      expect(await domainsService.checkDue(now)).toBe(3)

      const checked = store.customDomains
        .filter((item) => item.lastCheckedAt?.getTime() === now.getTime())
        .map((item) => item.hostname)
        .sort()

      expect(checked).toEqual(['new.com', 'old-live.com', 'stale.com'])
    })

    it('does nothing without the vercel configuration', async () => {
      Object.assign(env, { VERCEL_API_TOKEN: undefined })

      store.customDomains.push(buildCustomDomain())

      expect(await domainsService.checkDue()).toBe(0)
    })

    it('runs from the queue processor', async () => {
      const checkDue = spyOn(domainsService, 'checkDue').mockResolvedValue(0)

      await processDomainsJob({ name: 'check-domains' })

      await processDomainsJob({ name: 'other' })

      expect(checkDue).toHaveBeenCalledTimes(1)
    })
  })

  describe('customDomain on the page', () => {
    it('shows the live domain of a Pro owner on the dashboard and the public page', async () => {
      const { headers } = owner(true)

      store.pages[0] = { ...store.pages[0], isPublished: true } as (typeof store.pages)[number]

      const mine = await app.inject({ method: 'GET', url: '/pages/me', headers })

      expect(mine.json().customDomain).toBe('seunome.com')

      const preview = await app.inject({ method: 'GET', url: '/pages/me/preview', headers })

      expect(preview.json().customDomain).toBe('seunome.com')

      const publicPage = await app.inject({ method: 'GET', url: '/pages/maria' })

      expect(publicPage.json().customDomain).toBe('seunome.com')
    })

    it('hides the domain when the owner is not Pro', async () => {
      const { headers } = owner(false)

      const mine = await app.inject({ method: 'GET', url: '/pages/me', headers })

      expect(mine.json().customDomain).toBeNull()
    })

    it('hides a domain that is not live', async () => {
      const { headers } = owner(true, 'pending_dns')

      const mine = await app.inject({ method: 'GET', url: '/pages/me', headers })

      expect(mine.json().customDomain).toBeNull()
    })
  })
})
