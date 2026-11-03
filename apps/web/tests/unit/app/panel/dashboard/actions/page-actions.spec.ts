import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'

import { buildApiDashboard, buildApiPage } from '../../../../support/builders'
import {
  authorization,
  createAxiosError,
  revalidatePath,
  spyOnApi,
} from '../../../../support/mocks'

const { toDashboardData, defaultTheme } = await import(
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
          theme: defaultTheme,
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

    it('rejects an invalid color without calling the API', async () => {
      const result = await updatePage({
        ...data,
        appearance: { ...data.appearance, background: 'red' },
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
