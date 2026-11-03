import { afterAll, beforeEach, describe, expect, test } from 'bun:test'
import { AxiosError, AxiosHeaders, type InternalAxiosRequestConfig } from 'axios'
import { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

import { registerUser } from '@/app/[locale]/(public)/register/_actions/register'
import { api } from '@/lib/api'

process.env.AUTH_SECRET = 'test-only-secret-with-at-least-32-characters'
process.env.AUTH_URL = 'http://localhost:3000'
process.env.AUTH_TRUST_HOST = 'true'

const { getAuthorizationFromRequest } = await import('@/lib/get-api-authorization')
const { default: proxy } = await import('@/proxy')
const { handlers } = await import('@/lib/auth')

const originalAdapter = api.defaults.adapter

const user = {
  id: 'a26d7946-6249-4f68-95e6-5cb612ccf538',
  name: 'Teste',
  email: 'test@example.com',
}

const credentials = { email: user.email, password: 'password123' }
const calls: InternalAxiosRequestConfig[] = []
let failure: { path: string; status: number } | undefined
let expired = false
let currentUser = { ...user }
let jar: Map<string, string>

function accessToken() {
  const exp = Math.floor(Date.now() / 1000) + (expired ? -60 : 900)
  return `header.${Buffer.from(JSON.stringify({ sub: user.id, exp })).toString('base64url')}.signature`
}

beforeEach(() => {
  jar = new Map()
  failure = undefined
  expired = false
  currentUser = { ...user }
  calls.length = 0
  api.defaults.adapter = async (config) => {
    calls.push(config)
    const response = {
      config,
      status: 200,
      statusText: 'OK',
      headers: new AxiosHeaders(),
      data: {} as unknown,
    }
    if (failure && failure.path === config.url) {
      response.status = failure.status
      response.data = { message: 'API error' }
      throw new AxiosError('API error', 'ERR_BAD_RESPONSE', config, undefined, response)
    }
    if (config.url === '/auth/login' || config.url === '/auth/refresh') {
      response.data = { accessToken: accessToken() }
      response.headers['set-cookie'] = [
        `refreshToken=${config.url === '/auth/refresh' ? 'rotated' : 'original'}; Path=/auth; HttpOnly`,
      ]
    } else if (config.url === '/users/me') {
      response.data = currentUser
    }
    return response
  }
})

afterAll(() => {
  api.defaults.adapter = originalAdapter
})

async function request(path: string, body?: Record<string, unknown>, json = false) {
  const headers = new Headers({ cookie: [...jar].map(([k, v]) => `${k}=${v}`).join('; ') })
  if (body)
    headers.set('content-type', json ? 'application/json' : 'application/x-www-form-urlencoded')
  const req = new NextRequest(`http://localhost:3000/api/auth/${path}`, {
    method: body ? 'POST' : 'GET',
    headers,
    body: body
      ? json
        ? JSON.stringify(body)
        : new URLSearchParams(body as Record<string, string>)
      : undefined,
  })
  const response = await (body ? handlers.POST(req) : handlers.GET(req))
  for (const cookie of response.headers.getSetCookie()) {
    const pair = cookie.split(';')[0]
    const index = pair.indexOf('=')
    const name = pair.slice(0, index)
    const value = pair.slice(index + 1)
    if (value) jar.set(name, value)
    else jar.delete(name)
  }
  return response
}

async function login(input = credentials) {
  const { csrfToken } = await (await request('csrf')).json()
  return request('callback/credentials', { ...input, csrfToken, callbackUrl: '/dashboard' })
}

async function updateSession(data: Record<string, unknown> = {}) {
  const { csrfToken } = await (await request('csrf')).json()
  return request('session', { csrfToken, data }, true)
}

describe('NextAuth and the Lynko API', () => {
  test('refreshes account data from the API and ignores client identity and token overrides', async () => {
    await login()
    currentUser = { ...user, name: 'Nome atualizado', email: 'updated@example.com' }
    calls.length = 0
    const response = await updateSession({
      id: 'attacker',
      name: 'Forged',
      email: 'fake@example.com',
      image: 'https://example.com/fake.jpg',
      accessToken: 'forged-access',
      refreshToken: 'forged-refresh',
      role: 'admin',
    })
    const session = await response.json()
    expect(session.user).toEqual({ ...currentUser, image: null })
    expect(calls.map((call) => call.url)).toEqual(['/users/me'])
    expect(calls[0].headers.get('Authorization')).toBe(`Bearer ${accessToken()}`)
    const token = await getToken({
      req: new NextRequest('http://localhost:3000', {
        headers: { cookie: [...jar].map(([key, value]) => `${key}=${value}`).join('; ') },
      }),
      secret: process.env.AUTH_SECRET,
    })
    expect(token?.sub).toBe(user.id)
    expect(token?.accessToken).toBe(accessToken())
    expect(token?.refreshToken).toBe('original')
    expect(token).not.toHaveProperty('role')
    const persisted = await (await request('session')).json()
    expect(persisted.user).toEqual(session.user)
    expect(JSON.stringify(session)).not.toContain('Token')
  })

  test('renews expired credentials before refreshing account data', async () => {
    expired = true
    await login()
    expired = false
    currentUser = { ...user, name: 'Nome atualizado' }
    calls.length = 0
    const session = await (await updateSession()).json()
    expect(calls.map((call) => call.url)).toEqual(['/auth/refresh', '/users/me'])
    expect(calls[1].headers.get('Authorization')).toBe(`Bearer ${accessToken()}`)
    expect(session.user.name).toBe(currentUser.name)
  })

  test('ends the session if the API rejects the authenticated profile', async () => {
    await login()
    failure = { path: '/users/me', status: 401 }
    expect(await (await updateSession()).json()).toBeNull()
    expect(await (await request('session')).json()).toBeNull()
  })

  test('rejects a profile belonging to a different account', async () => {
    await login()
    currentUser = { ...user, id: 'b26d7946-6249-4f68-95e6-5cb612ccf538' }
    expect(await (await updateSession()).json()).toBeNull()
  })

  test('preserves the session with an explicit error when profile refresh fails, and recovers on retry', async () => {
    await login()
    failure = { path: '/users/me', status: 503 }
    const failed = await (await updateSession()).json()
    expect(failed.user).toMatchObject(user)
    expect(failed.error).toBe('UserUpdateFailed')
    failure = undefined
    currentUser = { ...user, name: 'Recuperado' }
    const recovered = await (await updateSession()).json()
    expect(recovered.user.name).toBe('Recuperado')
    expect(recovered).not.toHaveProperty('error')
  })

  test('authorizes dashboard API calls without exposing tokens to the client session', async () => {
    await login()
    const headers = new Headers({
      cookie: [...jar].map(([key, value]) => `${key}=${value}`).join('; '),
    })
    const authorization = await getAuthorizationFromRequest(
      new NextRequest('http://localhost:3000/api/auth/session', { headers }),
      async () => {
        throw new Error('Unexpected refresh')
      },
    )
    expect(authorization.Authorization).toBe(`Bearer ${accessToken()}`)
  })

  test('refreshes an expired API token using the existing auth handler and persists the new cookie', async () => {
    expired = true
    await login()
    expired = false
    calls.length = 0
    const headers = new Headers({
      cookie: [...jar].map(([key, value]) => `${key}=${value}`).join('; '),
    })
    let persisted = false
    const authorization = await getAuthorizationFromRequest(
      new NextRequest('http://localhost:3000/api/auth/session', { headers }),
      async (cookies) => {
        persisted = cookies.some(
          (cookie) => cookie.name.startsWith('authjs.session-token') && !!cookie.value,
        )
      },
    )
    expect(persisted).toBe(true)
    expect(calls.map((call) => call.url)).toEqual(['/auth/refresh'])
    expect(authorization.Authorization).toBe(`Bearer ${accessToken()}`)
  })

  test('rejects dashboard access after a refresh failure', async () => {
    expired = true
    await login()
    expired = false
    failure = { path: '/auth/refresh', status: 401 }
    const headers = new Headers({
      cookie: [...jar].map(([key, value]) => `${key}=${value}`).join('; '),
    })
    await expect(
      getAuthorizationFromRequest(
        new NextRequest('http://localhost:3000/api/auth/session', { headers }),
        async () => {},
      ),
    ).rejects.toThrow('Sua sessão expirou')
  })

  test('authenticates, loads the profile and keeps API tokens out of the client session', async () => {
    const response = await login()
    expect(response.headers.get('location')).toBe('http://localhost:3000/dashboard')
    expect(calls.map((call) => call.url)).toEqual(['/auth/login', '/users/me'])
    expect(calls[1].headers.get('Authorization')).toBe(`Bearer ${accessToken()}`)
    const session = await (await request('session')).json()
    expect(session.user).toMatchObject(user)
    expect(JSON.stringify(session)).not.toContain('accessToken')
    expect(JSON.stringify(session)).not.toContain('refreshToken')
    expect([...jar.keys()]).toContain('authjs.session-token')
    expect(response.headers.getSetCookie().join(';')).toContain('HttpOnly')
  })

  test('rejects invalid credentials without creating a session', async () => {
    failure = { path: '/auth/login', status: 401 }
    const response = await login()
    expect(response.headers.get('location')).toContain('code=credentials')
    expect(await (await request('session')).json()).toBeNull()
  })

  test('returns a distinct rate-limit error', async () => {
    failure = { path: '/auth/login', status: 429 }
    expect((await login()).headers.get('location')).toContain('code=too_many_attempts')
  })

  test('handles an unavailable API without returning its error details', async () => {
    failure = { path: '/auth/login', status: 503 }
    expect((await login()).headers.get('location')).toContain('code=unavailable')
  })

  test('validates credentials on the server before calling the API', async () => {
    await login({ email: 'invalid', password: '' })
    expect(calls).toHaveLength(0)
    expect(await (await request('session')).json()).toBeNull()
  })

  test('renews an expired access token using the API refresh cookie', async () => {
    expired = true
    await login()
    expired = false
    const session = await (await request('session')).json()
    expect(session.user.id).toBe(user.id)
    expect(calls.find((call) => call.url === '/auth/refresh')?.headers.get('Cookie')).toBe(
      'refreshToken=original',
    )
    await request('session')
    expect(calls.filter((call) => call.url === '/auth/refresh')).toHaveLength(1)
  })

  test('clears the NextAuth session when the API refresh token is rejected', async () => {
    expired = true
    await login()
    failure = { path: '/auth/refresh', status: 401 }
    expect(await (await request('session')).json()).toBeNull()
    expect(jar.has('authjs.session-token')).toBe(false)
  })

  test('revokes the API session on sign-out using the rotated refresh token', async () => {
    expired = true
    await login()
    expired = false
    await request('session')
    const { csrfToken } = await (await request('csrf')).json()
    await request('signout', { csrfToken })
    expect(calls.find((call) => call.url === '/auth/logout')?.headers.get('Cookie')).toBe(
      'refreshToken=rotated',
    )
    expect(await (await request('session')).json()).toBeNull()
  })

  test('protects the dashboard while preserving locale routing', async () => {
    for (const [path, target] of [
      ['/dashboard', '/login'],
      ['/pt/dashboard', '/pt/login'],
      ['/en/dashboard', '/login'],
    ]) {
      const response = await proxy(new NextRequest(`http://localhost:3000${path}`))
      expect(response?.headers.get('location')).toBe(`http://localhost:3000${target}`)
    }
    const response = await proxy(new NextRequest('http://localhost:3000/pt/login'))
    expect(response?.headers.get('x-middleware-next')).toBe('1')
  })

  test('allows authenticated users through to the dashboard', async () => {
    await login()
    const response = await proxy(
      new NextRequest('http://localhost:3000/pt/dashboard', {
        headers: { cookie: [...jar].map(([k, v]) => `${k}=${v}`).join('; ') },
      }),
    )
    expect(response?.headers.get('location')).toBeNull()
    expect(response?.headers.get('x-middleware-next')).toBe('1')
    expect(response?.headers.get('x-middleware-set-cookie')).toContain('authjs.session-token=')
  })

  test('redirects signed-in users from login to the dashboard in their locale', async () => {
    await login()
    for (const [path, target] of [
      ['/login', '/dashboard'],
      ['/pt/login', '/pt/dashboard'],
      ['/en/login', '/dashboard'],
    ]) {
      const response = await proxy(
        new NextRequest(`http://localhost:3000${path}`, {
          headers: { cookie: [...jar].map(([k, v]) => `${k}=${v}`).join('; ') },
        }),
      )
      expect(response.headers.get('location')).toBe(`http://localhost:3000${target}`)
    }
  })
})

describe('registration action', () => {
  const input = { ...credentials, name: user.name }

  test('posts registration details to the API', async () => {
    expect(await registerUser(input)).toEqual({})
    expect(calls[0].url).toBe('/auth/register')
    expect(JSON.parse(calls[0].data)).toEqual(input)
  })

  test('translates duplicate-email errors', async () => {
    failure = { path: '/auth/register', status: 409 }
    expect(await registerUser(input)).toEqual({ error: 'Já existe uma conta com este e-mail.' })
  })

  test('handles API failures without throwing', async () => {
    failure = { path: '/auth/register', status: 500 }
    expect(await registerUser(input)).toEqual({
      error: 'Não foi possível criar sua conta. Tente novamente.',
    })
  })
})
