import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'

import { buildApiDashboard } from '../../../../support/builders'
import { authorization, createAxiosError, spyOnApi } from '../../../../support/mocks'

const { getDashboard } = await import('@/app/[locale]/(panel)/dashboard/_data-access/get-dashboard')

describe('getDashboard', () => {
  let api: ReturnType<typeof spyOnApi>

  const dashboard = buildApiDashboard()

  function respondWith(responses: Record<string, unknown>) {
    api.get.mockImplementation((async (url: string) => {
      const response = responses[url]
      if (response instanceof Error) throw response

      return { data: response }
    }) as never)
  }

  beforeEach(() => {
    api = spyOnApi()
  })

  afterEach(() => {
    mock.restore()
  })

  it('loads the account, the page and the links with the bearer token', async () => {
    respondWith({
      '/users/me': dashboard.user,
      '/pages/me': dashboard.page,
      '/links': dashboard.links,
    })

    const result = await getDashboard()

    expect(result).toEqual(dashboard)
    expect(api.get.mock.calls).toEqual([
      ['/users/me', { headers: authorization }],
      ['/pages/me', { headers: authorization }],
      ['/links', { headers: authorization }],
    ])
  })

  it('returns no page and no links when the user has not created a page yet', async () => {
    respondWith({ '/users/me': dashboard.user, '/pages/me': createAxiosError(404) })

    const result = await getDashboard()

    expect(result).toEqual({ user: dashboard.user, page: null, links: [] })
    expect(api.get).toHaveBeenCalledTimes(2)
  })

  it('throws for any other page error', async () => {
    respondWith({
      '/users/me': dashboard.user,
      '/pages/me': createAxiosError(500, { message: 'Internal server error' }),
    })

    await expect(getDashboard()).rejects.toThrow(
      'Não foi possível carregar seu dashboard. Tente novamente.',
    )
  })

  it('throws the session message when the token expired', async () => {
    respondWith({ '/users/me': createAxiosError(401, { message: 'Unauthorized' }) })

    await expect(getDashboard()).rejects.toThrow(
      'Sua sessão expirou. Entre novamente para continuar.',
    )
  })
})
