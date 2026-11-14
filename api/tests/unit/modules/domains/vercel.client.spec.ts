import { afterEach, beforeEach, describe, expect, it, mock, spyOn } from 'bun:test'
import { env } from '../../../../src/config/env'
import { vercel } from '../../../../src/modules/domains/vercel.client'

const vercelEnv = {
  VERCEL_API_TOKEN: 'vercel-test-token',
  VERCEL_PROJECT_ID: 'prj_123',
  VERCEL_TEAM_ID: 'team_456',
}

const domain = { name: 'seunome.com', verified: true, verification: [] }

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

function mockFetch(...responses: Response[]) {
  const spy = spyOn(globalThis, 'fetch')

  for (const response of responses) spy.mockResolvedValueOnce(response)

  return spy
}

function call(spy: ReturnType<typeof mockFetch>, index = 0) {
  const [input, init] = spy.mock.calls[index] ?? []

  return { url: new URL(String(input)), init: init as RequestInit }
}

describe('vercel client', () => {
  const original = {
    VERCEL_API_TOKEN: env.VERCEL_API_TOKEN,
    VERCEL_PROJECT_ID: env.VERCEL_PROJECT_ID,
    VERCEL_TEAM_ID: env.VERCEL_TEAM_ID,
  }

  beforeEach(() => {
    Object.assign(env, vercelEnv)

    spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    Object.assign(env, original)

    mock.restore()
  })

  it('adds a domain with auth header, team and redirect', async () => {
    const spy = mockFetch(jsonResponse({ ...domain, name: 'www.seunome.com', verified: false }))

    const result = await vercel.addProjectDomain('www.seunome.com', 'seunome.com')

    const { url, init } = call(spy)

    expect(url.origin + url.pathname).toBe('https://api.vercel.com/v10/projects/prj_123/domains')

    expect(url.searchParams.get('teamId')).toBe('team_456')

    expect(init.method).toBe('POST')

    expect(new Headers(init.headers).get('authorization')).toBe('Bearer vercel-test-token')

    expect(JSON.parse(String(init.body))).toEqual({
      name: 'www.seunome.com',
      redirect: 'seunome.com',
      redirectStatusCode: 308,
    })

    expect(result).toEqual({
      status: 'added',
      name: 'www.seunome.com',
      verified: false,
      verification: [],
    })
  })

  it('treats a 409 as in use elsewhere unless the project already has it', async () => {
    mockFetch(
      jsonResponse({ error: { code: 'domain_already_in_use' } }, 409),
      jsonResponse({}, 404),
    )

    expect(await vercel.addProjectDomain('seunome.com')).toEqual({ status: 'in_use_elsewhere' })

    mock.restore()

    spyOn(console, 'error').mockImplementation(() => {})

    mockFetch(jsonResponse({}, 409), jsonResponse(domain))

    expect(await vercel.addProjectDomain('seunome.com')).toEqual({ status: 'added', ...domain })
  })

  it('reads the project domain and returns null when missing', async () => {
    const spy = mockFetch(jsonResponse(domain), jsonResponse({}, 404))

    expect(await vercel.getProjectDomain('seunome.com')).toEqual(domain)

    expect(call(spy).url.pathname).toBe('/v9/projects/prj_123/domains/seunome.com')

    expect(await vercel.getProjectDomain('seunome.com')).toBeNull()
  })

  it('verifies a domain', async () => {
    const spy = mockFetch(jsonResponse(domain), jsonResponse({ error: {} }, 400))

    expect(await vercel.verifyProjectDomain('seunome.com')).toBe(true)

    expect(call(spy).url.pathname).toBe('/v9/projects/prj_123/domains/seunome.com/verify')

    expect(call(spy).init.method).toBe('POST')

    expect(await vercel.verifyProjectDomain('seunome.com')).toBe(false)
  })

  it('reads the recommended records ordered by rank', async () => {
    const spy = mockFetch(
      jsonResponse({
        misconfigured: true,
        recommendedIPv4: [
          { rank: 2, value: ['198.51.100.2'] },
          { rank: 1, value: ['198.51.100.1'] },
        ],
        recommendedCNAME: [
          { rank: 2, value: 'b.vercel-dns-017.com.' },
          { rank: 1, value: 'a.vercel-dns-017.com.' },
        ],
      }),
    )

    expect(await vercel.getDomainConfig('seunome.com')).toEqual({
      misconfigured: true,
      recommendedIPv4: ['198.51.100.1', '198.51.100.2'],
      recommendedCNAME: ['a.vercel-dns-017.com.', 'b.vercel-dns-017.com.'],
    })

    const { url } = call(spy)

    expect(url.pathname).toBe('/v6/domains/seunome.com/config')

    expect(url.searchParams.get('projectIdOrName')).toBe('prj_123')
  })

  it('removes a domain and ignores 404', async () => {
    const spy = mockFetch(jsonResponse({}), jsonResponse({}, 404))

    await vercel.removeProjectDomain('seunome.com')

    expect(call(spy).init.method).toBe('DELETE')

    await expect(vercel.removeProjectDomain('seunome.com')).resolves.toBeUndefined()
  })

  it('throws 503 on server errors, invalid bodies and network failures', async () => {
    mockFetch(jsonResponse({}, 500), jsonResponse({ unexpected: true }), jsonResponse({}, 500))

    await expect(vercel.getProjectDomain('seunome.com')).rejects.toMatchObject({ statusCode: 503 })

    await expect(vercel.getProjectDomain('seunome.com')).rejects.toMatchObject({ statusCode: 503 })

    await expect(vercel.removeProjectDomain('seunome.com')).rejects.toMatchObject({
      statusCode: 503,
    })

    mock.restore()

    spyOn(console, 'error').mockImplementation(() => {})

    spyOn(globalThis, 'fetch').mockRejectedValue(new Error('offline'))

    await expect(vercel.getProjectDomain('seunome.com')).rejects.toMatchObject({ statusCode: 503 })
  })

  it('throws 503 without calling vercel when not configured', async () => {
    Object.assign(env, { VERCEL_API_TOKEN: undefined })

    const spy = spyOn(globalThis, 'fetch')

    expect(vercel.isConfigured()).toBe(false)

    await expect(vercel.addProjectDomain('seunome.com')).rejects.toMatchObject({ statusCode: 503 })

    expect(spy).not.toHaveBeenCalled()
  })

  it('never logs the token', async () => {
    const log = spyOn(console, 'error').mockImplementation(() => {})

    mockFetch(jsonResponse({}, 500))

    await vercel.getProjectDomain('seunome.com').catch(() => {})

    expect(JSON.stringify(log.mock.calls)).not.toContain('vercel-test-token')
  })
})
