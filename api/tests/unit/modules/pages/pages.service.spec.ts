import { afterEach, beforeEach, describe, expect, it, mock, spyOn } from 'bun:test'

import { pagesRepository } from '../../../../src/modules/pages/pages.repository'
import { defaultPageTheme } from '../../../../src/modules/pages/pages.theme'
import { ConflictError, NotFoundError } from '../../../../src/shared/errors'
import { useInMemoryRepositories } from '../../support/memory-repositories'
import { pagesService } from '../../../../src/modules/pages/pages.service'
import { buildLink, buildPage } from '../../support/builders'

describe('pagesService', () => {
  let store: ReturnType<typeof useInMemoryRepositories>

  const userId = 'a26d7946-6249-4f68-95e6-5cb612ccf538'

  beforeEach(() => {
    store = useInMemoryRepositories()
  })

  afterEach(() => {
    mock.restore()
  })

  describe('create', () => {
    const input = { username: 'maria', title: 'Maria Silva', theme: defaultPageTheme }

    it('creates the page of the user', async () => {
      const page = await pagesService.create(userId, input)

      expect(page).toMatchObject({ userId, username: 'maria', isPublished: false })
    })

    it('throws ConflictError when the user already has a page', async () => {
      store.pages.push(buildPage({ userId, username: 'other' }))

      await expect(pagesService.create(userId, input)).rejects.toThrow('User already has a page')
    })

    it('throws ConflictError when the username is taken', async () => {
      store.pages.push(buildPage({ username: 'maria' }))

      await expect(pagesService.create(userId, input)).rejects.toThrow('Username already taken')
    })

    it('converts a unique violation from a race into ConflictError', async () => {
      const race = new Error('duplicate', {
        cause: { code: '23505', constraint: 'pages_username_unique' },
      })

      spyOn(pagesRepository, 'create').mockImplementation(async () => {
        throw race
      })

      await expect(pagesService.create(userId, input)).rejects.toBeInstanceOf(ConflictError)
    })
  })

  describe('updateMine', () => {
    it('merges the partial theme with the current one', async () => {
      store.pages.push(buildPage({ userId }))

      const page = await pagesService.updateMine(userId, {
        isPublished: true,
        theme: { backgroundColor: '#e9ff9e' },
      })

      expect(page.isPublished).toBe(true)
      expect(page.theme).toEqual({ ...defaultPageTheme, backgroundColor: '#e9ff9e' })
    })

    it('keeps the username when it does not change', async () => {
      store.pages.push(buildPage({ userId, username: 'maria' }))

      await expect(pagesService.updateMine(userId, { username: 'maria' })).resolves.toMatchObject({
        username: 'maria',
      })
    })

    it('throws ConflictError when the new username belongs to another page', async () => {
      store.pages.push(buildPage({ userId, username: 'maria' }), buildPage({ username: 'joao' }))

      await expect(pagesService.updateMine(userId, { username: 'joao' })).rejects.toBeInstanceOf(
        ConflictError,
      )
    })

    it('throws NotFoundError when the user has no page', async () => {
      await expect(pagesService.updateMine(userId, { title: 'Nova' })).rejects.toBeInstanceOf(
        NotFoundError,
      )
    })
  })

  describe('deleteMine', () => {
    it('deletes the page and its links', async () => {
      const page = buildPage({ userId })

      store.pages.push(page)
      store.links.push(buildLink({ pageId: page.id }))

      await pagesService.deleteMine(userId)

      expect(store.pages).toHaveLength(0)
      expect(store.links).toHaveLength(0)
    })

    it('throws NotFoundError when there is nothing to delete', async () => {
      await expect(pagesService.deleteMine(userId)).rejects.toBeInstanceOf(NotFoundError)
    })
  })

  describe('getPublic', () => {
    it('returns the published page with only active links, in order', async () => {
      const page = buildPage({ username: 'maria', isPublished: true })

      store.pages.push(page)

      store.links.push(
        buildLink({ pageId: page.id, title: 'Segundo', position: 1 }),
        buildLink({ pageId: page.id, title: 'Oculto', position: 2, isActive: false }),
        buildLink({ pageId: page.id, title: 'Primeiro', position: 0 }),
      )

      const result = await pagesService.getPublic('maria')

      expect(result.links.map((link) => link.title)).toEqual(['Primeiro', 'Segundo'])
    })

    it('hides an unpublished page', async () => {
      store.pages.push(buildPage({ username: 'maria', isPublished: false }))

      await expect(pagesService.getPublic('maria')).rejects.toBeInstanceOf(NotFoundError)
    })
  })

  describe('getPreview', () => {
    it('returns the own page even when it is not published', async () => {
      store.pages.push(buildPage({ userId, isPublished: false }))

      await expect(pagesService.getPreview(userId)).resolves.toMatchObject({ links: [] })
    })
  })
})
