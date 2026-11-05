import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'

import { buildApiDashboard, buildApiPage } from '../../../../support/builders'
import {
  authorization,
  createAxiosError,
  revalidatePath,
  spyOnApi,
} from '../../../../support/mocks'

const { toDashboardData } = await import(
  '@/app/[locale]/(panel)/dashboard/_components/dashboard-data'
)

const { createPage } = await import('@/app/[locale]/(panel)/dashboard/_actions/create-page')

const { updatePage } = await import('@/app/[locale]/(panel)/dashboard/_actions/update-page')

describe('page actions', () => {
  let api: ReturnType<typeof spyOnApi>

  const data = toDashboardData(buildApiDashboard())

  beforeEach(() => {
    api = spyOnApi()

    revalidatePath.mockClear()
  })

  afterEach(() => {
    mock.restore()
  })

  describe('createPage', () => {
    it('creates a draft page without the account e-mail', async () => {
      const page = buildApiPage()

      api.post.mockResolvedValueOnce({ data: page })

      const result = await createPage(data)

      expect(api.post).toHaveBeenCalledWith(
        '/pages',
        {
          username: 'maria',
          title: 'Maria Silva',
          bio: undefined,
          avatarUrl: undefined,
        },
        { headers: authorization },
      )

      expect(revalidatePath).toHaveBeenCalledWith('/[locale]/dashboard', 'layout')
      expect(result).toEqual({ data: page })
    })

    it('rejects a reserved username without calling the API', async () => {
      const result = await createPage({ ...data, profile: { ...data.profile, username: 'admin' } })

      expect(result.error).toBeDefined()
      expect(api.post).not.toHaveBeenCalled()
    })
  })

  describe('updatePage', () => {
    it('sends empty bio and photo as null and keeps the publication flag', async () => {
      api.patch.mockResolvedValueOnce({ data: buildApiPage({ isPublished: true }) })

      await updatePage({ ...data, profile: { ...data.profile, published: true } })

      expect(api.patch).toHaveBeenCalledWith(
        '/pages/me',
        expect.objectContaining({ bio: null, avatarUrl: null, isPublished: true }),
        { headers: authorization },
      )
    })

    it('sends the uploaded avatar without copying its CDN url to avatarUrl', async () => {
      api.patch.mockResolvedValueOnce({ data: buildApiPage() })

      const avatarMediaId = '7f0c9e64-3f1d-4c2b-9a51-2d8e6f4b1a90'

      await updatePage({
        ...data,
        profile: { ...data.profile, image: 'https://cdn.lynko.test/media/a.png', avatarMediaId },
      })

      expect(api.patch).toHaveBeenCalledWith(
        '/pages/me',
        expect.objectContaining({ avatarUrl: null, avatarMediaId }),
        { headers: authorization },
      )
    })

    it('keeps the legacy avatar url when there is no upload', async () => {
      api.patch.mockResolvedValueOnce({ data: buildApiPage() })

      await updatePage({ ...data, profile: { ...data.profile, image: 'https://legacy.dev/a.png' } })

      expect(api.patch).toHaveBeenCalledWith(
        '/pages/me',
        expect.objectContaining({ avatarUrl: 'https://legacy.dev/a.png', avatarMediaId: null }),
        { headers: authorization },
      )
    })

    it('sends the social links in order', async () => {
      api.patch.mockResolvedValueOnce({ data: buildApiPage() })

      const socialLinks = [
        { platform: 'x' as const, url: 'https://x.com/maria', isActive: true },
        { platform: 'github' as const, url: 'https://github.com/maria', isActive: false },
      ]

      await updatePage({ ...data, socialLinks })

      expect(api.patch).toHaveBeenCalledWith(
        '/pages/me',
        expect.objectContaining({ socialLinks }),
        { headers: authorization },
      )
    })

    it('rejects an unsafe social link without calling the API', async () => {
      const result = await updatePage({
        ...data,
        socialLinks: [{ platform: 'github', url: 'javascript:alert(1)', isActive: true }],
      })

      expect(result.error).toBeDefined()
      expect(api.patch).not.toHaveBeenCalled()
    })

    it('sends appearance and does not send the legacy theme', async () => {
      api.patch.mockResolvedValueOnce({ data: buildApiPage() })

      const appearance = { ...data.appearance, theme: 'dark' as const }

      await updatePage({ ...data, appearance })

      const [, body] = api.patch.mock.calls[0] ?? []

      expect(body).toMatchObject({ appearance })

      expect(body).not.toHaveProperty('theme')
    })

    it('rejects an invalid color without calling the API', async () => {
      const result = await updatePage({
        ...data,
        appearance: { ...data.appearance, background: { type: 'solid', color: 'red' } },
      })

      expect(result.error).toBeDefined()
      expect(api.patch).not.toHaveBeenCalled()
    })

    it('translates a taken username and does not revalidate', async () => {
      api.patch.mockRejectedValueOnce(createAxiosError(409, { message: 'Username already taken' }))

      const result = await updatePage(data)

      expect(result).toEqual({ error: 'Este nome de usuário já está em uso.' })
      expect(revalidatePath).not.toHaveBeenCalled()
    })

    it('uses the fallback for an unknown API message', async () => {
      api.patch.mockRejectedValueOnce(createAxiosError(400, { message: 'Something else' }))

      const result = await updatePage(data)

      expect(result).toEqual({
        error: 'Não foi possível salvar sua página. Confira os dados e tente novamente.',
      })
    })
  })
})
