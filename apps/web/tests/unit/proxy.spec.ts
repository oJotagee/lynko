import { afterEach, beforeEach, describe, expect, mock, spyOn, test } from 'bun:test'
import { NextRequest } from 'next/server'

import { clearCustomDomainCache, isPlatformHost } from '@/lib/custom-domain'
import { SITE_URL } from '@/lib/site'

const { default: proxy } = await import('@/proxy')

const owners: Record<string, { username: string; pro: boolean }> = {
  'seunome.com': { username: 'maria', pro: true },
  'expirou.com': { username: 'joao', pro: false },
}

function mockResolve() {
  return spyOn(globalThis, 'fetch').mockImplementation((async (input: string | URL) => {
    const host = new URL(String(input)).searchParams.get('host') ?? ''

    const owner = owners[host]

    return owner
      ? Response.json(owner)
      : Response.json({ message: 'Domain not found' }, { status: 404 })
  }) as typeof fetch)
}

function visit(url: string) {
  return proxy(new NextRequest(url))
}

describe('custom domain proxy', () => {
  beforeEach(() => {
    clearCustomDomainCache()
  })

  afterEach(() => {
    mock.restore()
  })

  test('recognizes the platform hosts', () => {
    expect(isPlatformHost(new URL(SITE_URL).hostname)).toBe(true)

    expect(isPlatformHost('lynko-git-main.vercel.app')).toBe(true)

    expect(isPlatformHost('127.0.0.1')).toBe(true)

    expect(isPlatformHost('seunome.com')).toBe(false)
  })

  test('keeps the current flow on the platform host without resolving', async () => {
    const fetchSpy = mockResolve()

    const response = await visit('http://localhost:3000/dashboard')

    expect(response.headers.get('location')).toBe('http://localhost:3000/login')

    expect(fetchSpy).not.toHaveBeenCalled()
  })

  test('lets the api routes of the platform host through untouched', async () => {
    const fetchSpy = mockResolve()

    const response = await visit('http://localhost:3000/api/auth/session')

    expect(response.headers.get('x-middleware-next')).toBe('1')

    expect(response.headers.get('x-middleware-rewrite')).toBeNull()

    expect(fetchSpy).not.toHaveBeenCalled()
  })

  test('rewrites the root of a custom domain to the page and keeps the query', async () => {
    mockResolve()

    const response = await visit('https://seunome.com/?src=qr')

    expect(response.headers.get('x-middleware-rewrite')).toBe('https://seunome.com/en/maria?src=qr')

    expect(response.headers.get('location')).toBeNull()
  })

  test('rewrites the share images', async () => {
    mockResolve()

    const response = await visit('https://seunome.com/opengraph-image-15q8fx')

    expect(response.headers.get('x-middleware-rewrite')).toBe(
      'https://seunome.com/en/maria/opengraph-image-15q8fx',
    )
  })

  test('redirects other paths to the root', async () => {
    mockResolve()

    for (const path of ['/dashboard', '/login', '/maria', '/pt', '/api/auth/session']) {
      const response = await visit(`https://seunome.com${path}?x=1`)

      expect(response.status).toBe(308)

      expect(response.headers.get('location')).toBe('https://seunome.com/')
    }
  })

  test('sends visitors to the Lynko address when the owner is no longer Pro', async () => {
    mockResolve()

    const response = await visit('https://expirou.com/')

    expect(response.status).toBe(307)

    expect(response.headers.get('location')).toBe(`${SITE_URL}/joao`)
  })

  test('answers 404 for an unknown host', async () => {
    mockResolve()

    const response = await visit('https://desconhecido.com/')

    expect(response.status).toBe(404)

    expect(response.headers.get('x-middleware-rewrite')).toBeNull()
  })

  test('answers 503 without caching when the api fails', async () => {
    const fetchSpy = spyOn(globalThis, 'fetch').mockRejectedValue(new Error('offline'))

    expect((await visit('https://seunome.com/')).status).toBe(503)

    expect((await visit('https://seunome.com/')).status).toBe(503)

    expect(fetchSpy).toHaveBeenCalledTimes(2)
  })

  test('caches the resolve for the next requests', async () => {
    const fetchSpy = mockResolve()

    await visit('https://seunome.com/')

    await visit('https://seunome.com/')

    await visit('https://desconhecido.com/')

    await visit('https://desconhecido.com/')

    expect(fetchSpy).toHaveBeenCalledTimes(2)

    const [url] = fetchSpy.mock.calls[0] ?? []

    expect(String(url)).toEndWith('/domains/resolve?host=seunome.com')
  })
})
