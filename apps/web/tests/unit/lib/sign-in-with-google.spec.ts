import { afterAll, beforeEach, describe, expect, test } from 'bun:test'
import { AxiosError, AxiosHeaders, type InternalAxiosRequestConfig } from 'axios'
import type { Account, User } from 'next-auth'

import { api } from '@/lib/api'
import { signInWithGoogle } from '@/lib/sign-in-with-google'

const originalAdapter = api.defaults.adapter

const profile = {
  id: 'a26d7946-6249-4f68-95e6-5cb612ccf538',
  name: 'Maria Silva',
  email: 'maria@example.com',
}

const calls: InternalAxiosRequestConfig[] = []

let failure: { path: string; status: number } | undefined

function accessToken() {
  const exp = Math.floor(Date.now() / 1000) + 900

  return `header.${Buffer.from(JSON.stringify({ sub: profile.id, exp })).toString('base64url')}.signature`
}

function googleAccount(overrides: Partial<Account> = {}): Account {
  return {
    provider: 'google',
    type: 'oidc',
    providerAccountId: 'google-1',
    id_token: 'google-id-token',
    ...overrides,
  }
}

function googleUser(): User {
  return {
    id: 'google-1',
    name: 'Nome do Google',
    email: 'google@example.com',
    image: 'avatar.png',
  }
}

beforeEach(() => {
  failure = undefined

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

    if (config.url === '/auth/google') {
      response.data = { accessToken: accessToken() }

      response.headers['set-cookie'] = ['refreshToken=google-refresh; Path=/auth; HttpOnly']
    } else if (config.url === '/users/me') {
      response.data = profile
    }

    return response
  }
})

afterAll(() => {
  api.defaults.adapter = originalAdapter
})

describe('signInWithGoogle', () => {
  test('exchanges the id_token for API tokens and uses the API profile', async () => {
    const user = googleUser()

    await expect(signInWithGoogle(user, googleAccount())).resolves.toBe(true)

    expect(calls.map((call) => call.url)).toEqual(['/auth/google', '/users/me'])

    expect(JSON.parse(calls[0].data)).toEqual({ idToken: 'google-id-token' })

    expect(calls[1].headers.get('Authorization')).toBe(`Bearer ${accessToken()}`)

    expect(user).toMatchObject({
      ...profile,
      accessToken: accessToken(),
      refreshToken: 'google-refresh',
      image: 'avatar.png',
    })

    expect(user.accessTokenExpiresAt).toBeGreaterThan(Date.now())
  })

  test.each([401, 503])('refuses the sign-in when the API answers %i', async (status) => {
    failure = { path: '/auth/google', status }

    const user = googleUser()

    await expect(signInWithGoogle(user, googleAccount())).resolves.toBe(false)

    expect(user.accessToken).toBeUndefined()

    expect(calls.map((call) => call.url)).toEqual(['/auth/google'])
  })

  test('refuses the sign-in when the profile cannot be read', async () => {
    failure = { path: '/users/me', status: 500 }

    await expect(signInWithGoogle(googleUser(), googleAccount())).resolves.toBe(false)
  })

  test('refuses an account without id_token or from another provider, without calling the API', async () => {
    await expect(
      signInWithGoogle(googleUser(), googleAccount({ id_token: undefined })),
    ).resolves.toBe(false)

    await expect(
      signInWithGoogle(googleUser(), googleAccount({ provider: 'github' })),
    ).resolves.toBe(false)

    await expect(signInWithGoogle(googleUser(), null)).resolves.toBe(false)

    expect(calls).toHaveLength(0)
  })
})
