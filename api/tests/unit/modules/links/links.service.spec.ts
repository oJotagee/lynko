import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'
import { MAX_LINKS_PER_PAGE } from '../../../../src/modules/links/links.dto'
import { linksService } from '../../../../src/modules/links/links.service'
import { BadRequestError, ConflictError, NotFoundError } from '../../../../src/shared/errors'
import { buildLink, buildPage, type Page } from '../../support/builders'
import { useInMemoryRepositories } from '../../support/memory-repositories'

describe('linksService', () => {
  let store: ReturnType<typeof useInMemoryRepositories>

  let page: Page

  const userId = 'a26d7946-6249-4f68-95e6-5cb612ccf538'

  beforeEach(() => {
    store = useInMemoryRepositories()

    page = buildPage({ userId })

    store.pages.push(page)
  })

  afterEach(() => {
    mock.restore()
  })

  it('throws NotFoundError when the user has no page', async () => {
    store.pages = []

    await expect(linksService.list(userId)).rejects.toThrow('Page not found')
  })

  describe('create', () => {
    it('appends the link after the last position', async () => {
      store.links.push(buildLink({ pageId: page.id, position: 4 }))

      const link = await linksService.create(userId, { title: 'Blog', url: 'https://blog.dev' })

      expect(link).toMatchObject({ pageId: page.id, position: 5 })
    })

    it('starts at position 0 on an empty page', async () => {
      const link = await linksService.create(userId, { title: 'Blog', url: 'https://blog.dev' })

      expect(link.position).toBe(0)
    })

    it('throws ConflictError when the page reached the limit', async () => {
      for (let position = 0; position < MAX_LINKS_PER_PAGE; position++) {
        store.links.push(buildLink({ pageId: page.id, position }))
      }

      await expect(
        linksService.create(userId, { title: 'Blog', url: 'https://blog.dev' }),
      ).rejects.toBeInstanceOf(ConflictError)
    })
  })

  describe('update and delete', () => {
    it('updates a link of the own page', async () => {
      const link = buildLink({ pageId: page.id })

      store.links.push(link)

      await expect(
        linksService.update(userId, link.id, { isActive: false }),
      ).resolves.toMatchObject({ isActive: false })
    })

    it('treats a link from another page as not found', async () => {
      const foreign = buildLink({ pageId: buildPage().id })

      store.links.push(foreign)

      await expect(
        linksService.update(userId, foreign.id, { title: 'Hack' }),
      ).rejects.toBeInstanceOf(NotFoundError)

      await expect(linksService.delete(userId, foreign.id)).rejects.toBeInstanceOf(NotFoundError)
      expect(store.links).toContain(foreign)
    })

    it('deletes a link of the own page', async () => {
      const link = buildLink({ pageId: page.id })

      store.links.push(link)

      await linksService.delete(userId, link.id)

      expect(store.links).toHaveLength(0)
    })
  })

  describe('reorder', () => {
    it('saves the new order and returns the links sorted', async () => {
      const first = buildLink({ pageId: page.id, position: 0, title: 'Primeiro' })

      const second = buildLink({ pageId: page.id, position: 1, title: 'Segundo' })

      store.links.push(first, second)

      const links = await linksService.reorder(userId, [second.id, first.id])

      expect(links.map((link) => link.title)).toEqual(['Segundo', 'Primeiro'])
    })

    it.each([
      ['misses a link', (ids: string[]) => ids.slice(1)],
      ['repeats a link', (ids: string[]) => [ids[0] ?? '', ids[0] ?? '']],
      ['includes a foreign link', (ids: string[]) => [ids[0] ?? '', crypto.randomUUID()]],
    ])('throws BadRequestError when the list %s', async (_case, change) => {
      const links = [buildLink({ pageId: page.id }), buildLink({ pageId: page.id, position: 1 })]

      store.links.push(...links)

      await expect(
        linksService.reorder(userId, change(links.map((link) => link.id))),
      ).rejects.toBeInstanceOf(BadRequestError)
    })
  })
})
