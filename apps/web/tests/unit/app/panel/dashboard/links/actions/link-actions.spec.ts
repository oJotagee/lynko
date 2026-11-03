import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'

import { buildApiLink, linkId } from '../../../../../support/builders'
import {
  authorization,
  createAxiosError,
  revalidatePath,
  spyOnApi,
} from '../../../../../support/mocks'

const { createLink } = await import('@/app/[locale]/(panel)/dashboard/links/_actions/create-link')
const { updateLink } = await import('@/app/[locale]/(panel)/dashboard/links/_actions/update-link')
const { deleteLink } = await import('@/app/[locale]/(panel)/dashboard/links/_actions/delete-link')
const { reorderLinks } = await import(
  '@/app/[locale]/(panel)/dashboard/links/_actions/reorder-links'
)

describe('link actions', () => {
  let api: ReturnType<typeof spyOnApi>

  const link = buildApiLink()

  beforeEach(() => {
    api = spyOnApi()
    revalidatePath.mockClear()
  })

  afterEach(() => {
    mock.restore()
  })

  describe('createLink', () => {
    it('creates the link with the bearer token and revalidates the dashboard', async () => {
      api.post.mockResolvedValueOnce({ data: link })

      const result = await createLink({ title: ' Portfólio ', url: 'https://example.com' })

      expect(api.post).toHaveBeenCalledWith(
        '/links',
        { title: 'Portfólio', url: 'https://example.com' },
        { headers: authorization },
      )
      expect(revalidatePath).toHaveBeenCalledWith('/[locale]/dashboard', 'layout')
      expect(result).toEqual({ data: link })
    })

    it.each(['javascript:alert(1)', 'ftp://example.com', 'example.com'])(
      'never sends the url %s to the API',
      async (url) => {
        const result = await createLink({ title: 'Teste', url })

        expect(result.error).toBe('Não foi possível criar o link')
        expect(api.post).not.toHaveBeenCalled()
      },
    )

    it('translates the API limit error', async () => {
      api.post.mockRejectedValueOnce(
        createAxiosError(409, { message: 'A page can have at most 100 links' }),
      )

      const result = await createLink({ title: 'Blog', url: 'https://blog.dev' })

      expect(result).toEqual({ error: 'Sua página pode ter até 100 links.' })
      expect(revalidatePath).not.toHaveBeenCalled()
    })
  })

  describe('updateLink', () => {
    it('sends only the changed fields', async () => {
      api.patch.mockResolvedValueOnce({ data: { ...link, isActive: false } })

      const result = await updateLink(linkId, { isActive: false })

      expect(api.patch).toHaveBeenCalledWith(
        `/links/${linkId}`,
        { isActive: false },
        { headers: authorization },
      )
      expect(result.data?.isActive).toBe(false)
    })

    it('rejects an id that is not a uuid without calling the API', async () => {
      const result = await updateLink('../users/me', { isActive: true })

      expect(result.error).toBe('Não foi possível atualizar o link')
      expect(api.patch).not.toHaveBeenCalled()
    })

    it('translates a link that no longer exists', async () => {
      api.patch.mockRejectedValueOnce(createAxiosError(404, { message: 'Link not found' }))

      const result = await updateLink(linkId, { title: 'Novo' })

      expect(result).toEqual({ error: 'Este link não foi encontrado. Recarregue a lista.' })
    })
  })

  describe('deleteLink', () => {
    it('deletes the link and revalidates the dashboard', async () => {
      api.delete.mockResolvedValueOnce({ data: null })

      const result = await deleteLink(linkId)

      expect(api.delete).toHaveBeenCalledWith(`/links/${linkId}`, { headers: authorization })
      expect(revalidatePath).toHaveBeenCalledWith('/[locale]/dashboard', 'layout')
      expect(result).toEqual({ data: true })
    })

    it('returns the session message when the token expired', async () => {
      api.delete.mockRejectedValueOnce(createAxiosError(401, { message: 'Unauthorized' }))

      const result = await deleteLink(linkId)

      expect(result).toEqual({ error: 'Sua sessão expirou. Entre novamente para continuar.' })
    })
  })

  describe('reorderLinks', () => {
    it('sends the ids in the new order', async () => {
      api.put.mockResolvedValueOnce({ data: [link] })

      await reorderLinks([linkId])

      expect(api.put).toHaveBeenCalledWith(
        '/links/reorder',
        { linkIds: [linkId] },
        { headers: authorization },
      )
    })

    it('rejects an empty list without calling the API', async () => {
      const result = await reorderLinks([])

      expect(result.error).toBe('Não foi possível reordenar os links')
      expect(api.put).not.toHaveBeenCalled()
    })
  })
})
