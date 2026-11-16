import { afterEach, beforeEach, describe, expect, it, mock, spyOn } from 'bun:test'
import { env } from '../../../../src/config/env'
import { ownershipDns } from '../../../../src/modules/domains/domains.dns'
import { domainsService } from '../../../../src/modules/domains/domains.service'
import { hashPassword } from '../../../../src/shared/password'
import { createTestApp, signIn } from '../../support/app'
import { buildCustomDomain, buildSubscription } from '../../support/builders'
import { useInMemoryRepositories } from '../../support/memory-repositories'

const vercelEnv = {
  VERCEL_API_TOKEN: 'vercel-test-token',
  VERCEL_PROJECT_ID: 'prj_123',
  VERCEL_TEAM_ID: undefined,
  PLATFORM_HOSTS: ['lynko.app'],
}

interface FakeVercel {
  domains: Map<string, { verified: boolean; redirect?: string }>
  inUseElsewhere: Set<string>
  misconfigured: boolean
  verification: { type: string; domain: string; value: string }[]
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

function mockVercel(overrides: Partial<FakeVercel> = {}) {
  const state: FakeVercel = {
    domains: new Map(),
    inUseElsewhere: new Set(),
    misconfigured: false,
    verification: [],
    ...overrides,
  }

  const view = (name: string) => {
    const domain = state.domains.get(name)

    return {
      name,
      verified: domain?.verified ?? false,
      verification: domain?.verified ? [] : state.verification,
    }
  }

  const spy = spyOn(globalThis, 'fetch').mockImplementation((async (
    input: string | URL,
    init?: RequestInit,
  ) => {
    const url = new URL(String(input))

    const method = init?.method ?? 'GET'

    const config = url.pathname.match(/^\/v6\/domains\/([^/]+)\/config$/)

    if (config) {
      return jsonResponse({
        misconfigured: state.misconfigured,
        recommendedIPv4: [{ rank: 1, value: ['198.51.100.7'] }],
        recommendedCNAME: [{ rank: 1, value: 'abc.vercel-dns-017.com.' }],
      })
    }

    if (url.pathname === '/v10/projects/prj_123/domains' && method === 'POST') {
      const body = JSON.parse(String(init?.body)) as { name: string; redirect?: string }

      if (state.inUseElsewhere.has(body.name)) return jsonResponse({ error: {} }, 409)

      state.domains.set(body.name, {
        verified: state.verification.length === 0,
        redirect: body.redirect,
      })

      return jsonResponse(view(body.name))
    }

    const match = url.pathname.match(/^\/v9\/projects\/prj_123\/domains\/([^/]+)(\/verify)?$/)

    const name = decodeURIComponent(match?.[1] ?? '')

    if (match && method === 'DELETE') {
      state.domains.delete(name)

      return jsonResponse({})
    }

    if (match?.[2]) return jsonResponse({ error: {} }, 400)

    if (match) return state.domains.has(name) ? jsonResponse(view(name)) : jsonResponse({}, 404)

    return jsonResponse({}, 404)
  }) as typeof fetch)

  return { state, spy }
}

function calls(spy: ReturnType<typeof mockVercel>['spy'], method: string) {
  return spy.mock.calls
    .filter(([, init]) => (init?.method ?? 'GET') === method)
    .map(([input]) => new URL(String(input)).pathname)
}

describe('custom domains', () => {
  let store: ReturnType<typeof useInMemoryRepositories>

  let app: Awaited<ReturnType<typeof createTestApp>>

  const original = { ...env }

  let txtFound: boolean

  beforeEach(async () => {
    store = useInMemoryRepositories()

    app = await createTestApp()

    Object.assign(env, vercelEnv)

    domainsService.resetRoutingCache()

    txtFound = false

    spyOn(ownershipDns, 'hasToken').mockImplementation(async () => txtFound)

    spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(async () => {
    Object.assign(env, original)

    await app.close()

    mock.restore()
  })

  function signInPro(overrides: Parameters<typeof signIn>[2] = {}) {
    const session = signIn(app, store, overrides)

    store.subscriptions.push(buildSubscription({ userId: session.user.id }))

    return session
  }

  async function connect(headers: Record<string, string>, hostname: string) {
    return app.inject({ method: 'POST', url: '/domains/me', headers, payload: { hostname } })
  }

  async function check(headers: Record<string, string>) {
    return app.inject({ method: 'POST', url: '/domains/me/check', headers })
  }

  describe('POST /domains/me', () => {
    it('requires authentication', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/domains/me',
        payload: { hostname: 'seunome.com' },
      })

      expect(response.statusCode).toBe(401)
    })

    it('answers 403 for the free plan', async () => {
      mockVercel()

      const { headers } = signIn(app, store)

      expect((await connect(headers, 'seunome.com')).statusCode).toBe(403)
    })

    it('answers 404 without a page', async () => {
      mockVercel()

      const { headers } = signInPro({ page: false })

      expect((await connect(headers, 'seunome.com')).statusCode).toBe(404)
    })

    it('answers 400 for invalid or reserved addresses', async () => {
      mockVercel()

      const { headers } = signInPro()

      for (const hostname of ['not a domain', 'x.vercel.app', 'joao.lynko.app', '127.0.0.1']) {
        expect((await connect(headers, hostname)).statusCode).toBe(400)
      }
    })

    it('answers 409 when another account has the domain or the account has one', async () => {
      mockVercel()

      const { headers } = signInPro()

      store.customDomains.push(
        buildCustomDomain({ hostname: 'taken.com', ownerVerifiedAt: new Date() }),
      )

      expect((await connect(headers, 'https://www.Taken.com/')).statusCode).toBe(409)

      expect((await connect(headers, 'seunome.com')).statusCode).toBe(200)

      expect((await connect(headers, 'outro.com')).statusCode).toBe(409)
    })

    it('lets the owner connect a domain another account claimed without proof', async () => {
      mockVercel()

      const squatter = signInPro()

      const owner = signInPro()

      expect((await connect(squatter.headers, 'seunome.com')).statusCode).toBe(200)

      expect((await connect(owner.headers, 'seunome.com')).statusCode).toBe(200)

      txtFound = true

      expect((await check(owner.headers)).json().status).toBe('active')

      expect((await check(squatter.headers)).json()).toMatchObject({
        status: 'error',
        lastError: 'in_use_elsewhere',
      })
    })

    it('answers 503 without the vercel configuration', async () => {
      Object.assign(env, { VERCEL_API_TOKEN: undefined })

      const { headers } = signInPro()

      expect((await connect(headers, 'seunome.com')).statusCode).toBe(503)
    })

    it('saves the domain as pending and shows the TXT and the A record', async () => {
      const { spy } = mockVercel()

      const { user, headers } = signInPro()

      const response = await connect(headers, 'https://WWW.SeuNome.com/')

      expect(response.statusCode).toBe(200)

      const saved = store.customDomains.find((item) => item.userId === user.id)

      expect(saved?.hostname).toBe('seunome.com')

      expect(saved?.verificationToken).toHaveLength(32)

      expect(response.json()).toEqual({
        hostname: 'seunome.com',
        kind: 'apex',
        status: 'pending_owner',
        lastError: null,
        checkedAt: null,
        records: [
          {
            type: 'TXT',
            name: '_lynko',
            value: `lynko-verify=${saved?.verificationToken}`,
            purpose: 'ownership',
          },
          { type: 'A', name: '@', value: '198.51.100.7', purpose: 'routing' },
        ],
      })

      expect(calls(spy, 'POST')).toEqual([])
    })

    it('shows a CNAME for a subdomain', async () => {
      mockVercel()

      const { headers } = signInPro()

      const response = await connect(headers, 'links.seunome.com.br')

      expect(response.json().kind).toBe('subdomain')

      expect(response.json().records).toEqual([
        expect.objectContaining({ type: 'TXT', name: '_lynko.links' }),
        {
          type: 'CNAME',
          name: 'links',
          value: 'abc.vercel-dns-017.com',
          purpose: 'routing',
        },
      ])
    })
  })

  describe('GET /domains/me', () => {
    it('returns null without a domain', async () => {
      const { headers } = signInPro()

      const response = await app.inject({ method: 'GET', url: '/domains/me', headers })

      expect(response.statusCode).toBe(200)

      expect(response.json()).toBeNull()
    })
  })

  describe('POST /domains/me/check', () => {
    it('keeps the domain pending without the TXT and does not call vercel', async () => {
      const { spy } = mockVercel()

      const { headers } = signInPro()

      await connect(headers, 'seunome.com')

      const response = await check(headers)

      expect(response.json()).toMatchObject({ status: 'pending_owner', lastError: 'txt_missing' })

      expect(response.json().checkedAt).not.toBeNull()

      expect(calls(spy, 'POST')).toEqual([])
    })

    it('adds the apex and the www redirect, then goes live and sends one email', async () => {
      const { state } = mockVercel()

      const { headers } = signInPro()

      await connect(headers, 'seunome.com')

      txtFound = true

      const response = await check(headers)

      expect(response.json()).toMatchObject({ status: 'active', lastError: null, records: [] })

      expect(state.domains.get('seunome.com')).toEqual({ verified: true, redirect: undefined })

      expect(state.domains.get('www.seunome.com')?.redirect).toBe('seunome.com')

      expect(store.mails).toHaveLength(1)

      expect(store.mails[0]?.subject).toContain('seunome.com')

      await check(headers)

      expect(store.mails).toHaveLength(1)
    })

    it('adds only the subdomain', async () => {
      const { state } = mockVercel()

      const { headers } = signInPro()

      await connect(headers, 'links.seunome.com')

      txtFound = true

      await check(headers)

      expect([...state.domains.keys()]).toEqual(['links.seunome.com'])
    })

    it('waits for the DNS when the config is misconfigured', async () => {
      mockVercel({ misconfigured: true })

      const { headers } = signInPro()

      await connect(headers, 'seunome.com')

      txtFound = true

      const response = await check(headers)

      expect(response.json()).toMatchObject({
        status: 'pending_dns',
        lastError: 'dns_misconfigured',
        records: [{ type: 'A', name: '@', value: '198.51.100.7', purpose: 'routing' }],
      })

      expect(store.mails).toHaveLength(0)
    })

    it('shows the TXT vercel asks for', async () => {
      mockVercel({
        verification: [
          { type: 'TXT', domain: '_vercel.seunome.com', value: 'vc-domain-verify=abc' },
        ],
      })

      const { headers } = signInPro()

      await connect(headers, 'seunome.com')

      txtFound = true

      const response = await check(headers)

      expect(response.json().status).toBe('pending_dns')

      expect(response.json().records).toContainEqual({
        type: 'TXT',
        name: '_vercel',
        value: 'vc-domain-verify=abc',
        purpose: 'verification',
      })
    })

    it('marks an error when the domain is in another vercel project', async () => {
      mockVercel({ inUseElsewhere: new Set(['seunome.com']) })

      const { headers } = signInPro()

      await connect(headers, 'seunome.com')

      txtFound = true

      const response = await check(headers)

      expect(response.json()).toMatchObject({ status: 'error', lastError: 'in_use_elsewhere' })
    })

    it('keeps the status and reports vercel failures', async () => {
      spyOn(globalThis, 'fetch').mockRejectedValue(new Error('offline'))

      const { user, headers } = signInPro()

      store.customDomains.push(
        buildCustomDomain({
          userId: user.id,
          status: 'pending_dns',
          ownerVerifiedAt: new Date(),
        }),
      )

      const response = await check(headers)

      expect(response.statusCode).toBe(200)

      expect(response.json()).toMatchObject({ status: 'pending_dns', lastError: 'vercel_failed' })
    })

    it('answers 404 without a domain', async () => {
      mockVercel()

      const { headers } = signInPro()

      expect((await check(headers)).statusCode).toBe(404)
    })
  })

  describe('DELETE /domains/me', () => {
    it('removes the domain and the www from vercel and deletes the row', async () => {
      const { spy } = mockVercel()

      const { user, headers } = signInPro()

      store.customDomains.push(
        buildCustomDomain({ userId: user.id, status: 'active', ownerVerifiedAt: new Date() }),
      )

      const response = await app.inject({ method: 'DELETE', url: '/domains/me', headers })

      expect(response.statusCode).toBe(204)

      expect(calls(spy, 'DELETE').sort()).toEqual([
        '/v9/projects/prj_123/domains/seunome.com',
        '/v9/projects/prj_123/domains/www.seunome.com',
      ])

      expect(store.customDomains).toHaveLength(0)
    })

    it('skips vercel for a domain that never left the ownership step', async () => {
      const { spy } = mockVercel()

      const { user, headers } = signInPro()

      store.customDomains.push(buildCustomDomain({ userId: user.id }))

      const response = await app.inject({ method: 'DELETE', url: '/domains/me', headers })

      expect(response.statusCode).toBe(204)

      expect(spy).not.toHaveBeenCalled()
    })

    it('answers 404 without a domain', async () => {
      const { headers } = signInPro()

      const response = await app.inject({ method: 'DELETE', url: '/domains/me', headers })

      expect(response.statusCode).toBe(404)
    })
  })

  describe('account deletion', () => {
    it('removes the domain from vercel', async () => {
      const { spy } = mockVercel()

      const { user, headers } = signIn(app, store, {
        user: { passwordHash: await hashPassword('right-pass') },
      })

      store.customDomains.push(
        buildCustomDomain({
          userId: user.id,
          hostname: 'links.seunome.com',
          kind: 'subdomain',
          status: 'active',
          ownerVerifiedAt: new Date(),
        }),
      )

      const response = await app.inject({
        method: 'POST',
        url: '/users/me/deletion',
        headers,
        payload: { password: 'right-pass' },
      })

      expect(response.statusCode).toBe(204)

      expect(calls(spy, 'DELETE')).toEqual(['/v9/projects/prj_123/domains/links.seunome.com'])

      expect(store.customDomains).toHaveLength(0)
    })

    it('deletes the account even when vercel fails', async () => {
      spyOn(globalThis, 'fetch').mockRejectedValue(new Error('offline'))

      const { user, headers } = signIn(app, store, {
        user: { passwordHash: await hashPassword('right-pass') },
      })

      store.customDomains.push(
        buildCustomDomain({ userId: user.id, status: 'active', ownerVerifiedAt: new Date() }),
      )

      const response = await app.inject({
        method: 'POST',
        url: '/users/me/deletion',
        headers,
        payload: { password: 'right-pass' },
      })

      expect(response.statusCode).toBe(204)

      expect(store.users.some((item) => item.id === user.id)).toBe(false)
    })
  })
})
