import { afterEach, beforeEach, describe, expect, it, mock, spyOn } from 'bun:test'
import { mediaStorage } from '../../../../src/modules/media/media.storage'
import {
  appearanceFromTheme,
  defaultPageAppearance,
} from '../../../../src/modules/pages/pages.appearance'
import { pagesRepository } from '../../../../src/modules/pages/pages.repository'
import { pagesService } from '../../../../src/modules/pages/pages.service'
import { defaultPageTheme } from '../../../../src/modules/pages/pages.theme'
import { ConflictError, NotFoundError } from '../../../../src/shared/errors'
import { buildLink, buildMedia, buildPage, type Media, type Page } from '../../support/builders'
import { useInMemoryRepositories } from '../../support/memory-repositories'

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

    it('replaces socialLinks keeping order and the other fields', async () => {
      store.pages.push(buildPage({ userId, title: 'Maria' }))

      const socialLinks = [
        { platform: 'x' as const, url: 'https://x.com/maria', isActive: true },
        { platform: 'github' as const, url: 'https://github.com/maria', isActive: false },
      ]

      const page = await pagesService.updateMine(userId, { socialLinks })

      expect(page.socialLinks).toEqual(socialLinks)

      expect(page.title).toBe('Maria')

      expect(page.theme).toEqual(defaultPageTheme)
    })

    it('replaces appearance and keeps the other fields', async () => {
      store.pages.push(buildPage({ userId, title: 'Maria' }))

      const appearance = { ...defaultPageAppearance, theme: 'dark' as const }

      const page = await pagesService.updateMine(userId, { appearance })

      expect(page.appearance).toEqual(appearance)

      expect(page.title).toBe('Maria')

      expect(page.theme).toEqual(defaultPageTheme)
    })

    it('returns the appearance derived from the theme when none is stored', async () => {
      store.pages.push(buildPage({ userId, appearance: null }))

      const page = await pagesService.updateMine(userId, { title: 'Nova' })

      expect(page.appearance).toEqual(appearanceFromTheme(defaultPageTheme))
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

  describe('social links visibility', () => {
    const socialLinks = [
      { platform: 'x' as const, url: 'https://x.com/maria', isActive: true },
      { platform: 'github' as const, url: 'https://github.com/maria', isActive: false },
      { platform: 'spotify' as const, url: 'https://spotify.com/maria', isActive: true },
    ]

    const expected = [
      { platform: 'x' as const, url: 'https://x.com/maria' },
      { platform: 'spotify' as const, url: 'https://spotify.com/maria' },
    ]

    it('getPublic returns only active social links without isActive', async () => {
      store.pages.push(buildPage({ username: 'maria', isPublished: true, socialLinks }))

      const result = await pagesService.getPublic('maria')

      expect(result.socialLinks).toEqual(expected)
    })

    it('getPreview returns only active social links without isActive', async () => {
      store.pages.push(buildPage({ userId, socialLinks }))

      const result = await pagesService.getPreview(userId)

      expect(result.socialLinks).toEqual(expected)
    })
  })

  describe('appearance resolution', () => {
    it('create returns a complete appearance', async () => {
      const page = await pagesService.create(userId, {
        username: 'maria',
        title: 'Maria Silva',
        theme: defaultPageTheme,
      })

      expect(page.appearance).toEqual(appearanceFromTheme(defaultPageTheme))
    })

    it('getMine falls back to the theme and keeps a stored appearance', async () => {
      store.pages.push(buildPage({ userId, appearance: null }))

      await expect(pagesService.getMine(userId)).resolves.toMatchObject({
        appearance: appearanceFromTheme(defaultPageTheme),
      })

      Object.assign(store.pages[0] ?? {}, { appearance: defaultPageAppearance })

      await expect(pagesService.getMine(userId)).resolves.toMatchObject({
        appearance: defaultPageAppearance,
      })
    })

    it('getPublic and getPreview return a complete appearance', async () => {
      store.pages.push(buildPage({ userId, username: 'maria', isPublished: true }))

      const expected = appearanceFromTheme(defaultPageTheme)

      await expect(pagesService.getPublic('maria')).resolves.toMatchObject({ appearance: expected })

      await expect(pagesService.getPreview(userId)).resolves.toMatchObject({ appearance: expected })
    })
  })

  describe('getPreview', () => {
    it('returns the own page even when it is not published', async () => {
      store.pages.push(buildPage({ userId, isPublished: false }))

      await expect(pagesService.getPreview(userId)).resolves.toMatchObject({ links: [] })
    })
  })

  describe('media association', () => {
    let page: Page

    let remove: ReturnType<typeof spyOn>

    const imageAppearance = (imageMediaId: string) => ({
      ...defaultPageAppearance,
      background: { type: 'image' as const, imageMediaId },
    })

    beforeEach(() => {
      page = buildPage({ userId, avatarUrl: 'https://legacy.dev/me.png' })

      store.pages.push(page)

      remove = spyOn(mediaStorage, 'remove').mockResolvedValue()
    })

    function readyMedia(overrides: Partial<Media> = {}) {
      const media = buildMedia({
        pageId: page.id,
        status: 'ready',
        key: `media/${page.id}/${overrides.id ?? 'x'}.png`,
        ...overrides,
      })

      store.media.push(media)

      return media
    }

    it('associates an own ready avatar and returns its CDN url', async () => {
      const media = readyMedia()

      const result = await pagesService.updateMine(userId, { avatarMediaId: media.id })

      expect(result).toMatchObject({
        avatarMediaId: media.id,
        avatarUrl: `https://cdn.lynko.test/${media.key}`,
      })
    })

    it('associates an own ready background and returns its CDN url', async () => {
      const media = readyMedia({ type: 'background' })

      const result = await pagesService.updateMine(userId, {
        appearance: imageAppearance(media.id),
      })

      expect(result.backgroundImageUrl).toBe(`https://cdn.lynko.test/${media.key}`)

      page.isPublished = true

      expect((await pagesService.getPublic(page.username)).backgroundImageUrl).toBe(
        `https://cdn.lynko.test/${media.key}`,
      )
    })

    it.each([
      ['of another page', () => readyMedia({ pageId: buildPage().id })],
      ['still pending', () => readyMedia({ status: 'pending' })],
      ['of the wrong type', () => readyMedia({ type: 'background' })],
    ])('rejects an avatar %s with 404', async (_label, create) => {
      const media = create()

      await expect(pagesService.updateMine(userId, { avatarMediaId: media.id })).rejects.toThrow(
        'Media not found',
      )

      expect(page.avatarMediaId).toBeNull()
    })

    it('rejects a background of the wrong type with 404', async () => {
      const media = readyMedia({ type: 'avatar' })

      await expect(
        pagesService.updateMine(userId, { appearance: imageAppearance(media.id) }),
      ).rejects.toBeInstanceOf(NotFoundError)

      expect(page.appearance).toBeNull()
    })

    it('removes the previous avatar after the replacement', async () => {
      const previous = readyMedia({ id: crypto.randomUUID() })

      const next = readyMedia({ id: crypto.randomUUID() })

      page.avatarMediaId = previous.id

      await pagesService.updateMine(userId, { avatarMediaId: next.id })

      expect(store.media.map((media) => media.id)).toEqual([next.id])

      expect(remove).toHaveBeenCalledWith(previous.key)
    })

    it('removes the previous background when it switches to a solid color', async () => {
      const previous = readyMedia({ type: 'background' })

      page.appearance = imageAppearance(previous.id)

      await pagesService.updateMine(userId, { appearance: defaultPageAppearance })

      expect(store.media).toHaveLength(0)
    })

    it('keeps the update when removing the previous media fails', async () => {
      const previous = readyMedia()

      page.avatarMediaId = previous.id

      remove.mockRejectedValue(new Error('S3 down'))

      const error = spyOn(console, 'error').mockImplementation(() => {})

      const result = await pagesService.updateMine(userId, { avatarMediaId: null })

      expect(result.avatarMediaId).toBeNull()

      expect(error).toHaveBeenCalled()
    })

    it('clears the avatar with null and falls back to the legacy url', async () => {
      const previous = readyMedia()

      page.avatarMediaId = previous.id

      const result = await pagesService.updateMine(userId, { avatarMediaId: null })

      expect(result).toMatchObject({
        avatarMediaId: null,
        avatarUrl: 'https://legacy.dev/me.png',
      })

      expect(store.media).toHaveLength(0)
    })

    it('does not touch the media when other fields change', async () => {
      const media = readyMedia()

      page.avatarMediaId = media.id

      await pagesService.updateMine(userId, { title: 'Novo título' })

      expect(store.media).toHaveLength(1)

      expect(remove).not.toHaveBeenCalled()
    })
  })
})
