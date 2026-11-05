import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'

import { createAxiosError, spyOnApi } from '../../../support/mocks'

const { getPublicPage } = await import(
  '@/app/[locale]/(public)/[username]/_data-access/get-public-page'
)

describe('getPublicPage', () => {
  let api: ReturnType<typeof spyOnApi>

  beforeEach(() => {
    api = spyOnApi()
  })

  afterEach(() => {
    mock.restore()
  })

  it('returns the public page without authentication', async () => {
    const page = { username: 'maria', title: 'Maria', links: [], socialLinks: [] }

    api.get.mockResolvedValueOnce({ data: page })

    await expect(getPublicPage('maria')).resolves.toEqual(page as never)

    expect(api.get).toHaveBeenCalledWith('/pages/maria')
  })

  it('returns null when the page does not exist or is not published', async () => {
    api.get.mockRejectedValueOnce(createAxiosError(404, { message: 'Page not found' }))

    await expect(getPublicPage('ghost')).resolves.toBeNull()
  })

  it('throws on other errors', async () => {
    api.get.mockRejectedValueOnce(createAxiosError(500))

    await expect(getPublicPage('boom')).rejects.toThrow()
  })

  it('encodes the username in the path', async () => {
    api.get.mockResolvedValueOnce({ data: {} })

    await getPublicPage('a/b')

    expect(api.get).toHaveBeenCalledWith('/pages/a%2Fb')
  })
})
