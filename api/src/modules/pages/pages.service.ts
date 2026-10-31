import { ConflictError, NotFoundError } from '../../shared/errors'
import type { CreatePageBody, UpdatePageBody } from './pages.dto'
import { getUniqueViolation } from '../../shared/db-errors'
import { linksRepository } from '../links/links.repository'
import { pagesRepository } from './pages.repository'

const PAGE_ALREADY_EXISTS = 'User already has a page'
const USERNAME_TAKEN = 'Username already taken'

function toConflictError(error: unknown) {
  const constraint = getUniqueViolation(error)

  if (constraint === 'pages_username_unique') return new ConflictError(USERNAME_TAKEN)
  if (constraint === 'pages_user_id_unique') return new ConflictError(PAGE_ALREADY_EXISTS)

  return error
}

export const pagesService = {
  async create(userId: string, data: CreatePageBody) {
    if (await pagesRepository.findByUserId(userId)) {
      throw new ConflictError(PAGE_ALREADY_EXISTS)
    }

    if (await pagesRepository.findByUsername(data.username)) {
      throw new ConflictError(USERNAME_TAKEN)
    }

    try {
      const page = await pagesRepository.create({ ...data, userId })
      if (!page) throw new Error('Failed to create page')

      return page
    } catch (error) {
      throw toConflictError(error)
    }
  },

  async getMine(userId: string) {
    const page = await pagesRepository.findByUserId(userId)
    if (!page) {
      throw new NotFoundError('Page not found')
    }

    return page
  },

  async updateMine(userId: string, { theme, ...changes }: UpdatePageBody) {
    const current = await pagesService.getMine(userId)

    if (changes.username && changes.username !== current.username) {
      const owner = await pagesRepository.findByUsername(changes.username)

      if (owner) {
        throw new ConflictError(USERNAME_TAKEN)
      }
    }

    try {
      const page = await pagesRepository.updateByUserId(userId, {
        ...changes,
        ...(theme && { theme: { ...current.theme, ...theme } }),
      })
      if (!page) throw new NotFoundError('Page not found')

      return page
    } catch (error) {
      throw toConflictError(error)
    }
  },

  async deleteMine(userId: string) {
    const deleted = await pagesRepository.deleteByUserId(userId)
    if (!deleted) {
      throw new NotFoundError('Page not found')
    }
  },

  async getPublic(username: string) {
    const page = await pagesRepository.findPublishedByUsername(username)
    if (!page) {
      throw new NotFoundError('Page not found')
    }

    return { ...page, links: await linksRepository.findActiveByPageId(page.id) }
  },

  async getPreview(userId: string) {
    const page = await pagesService.getMine(userId)

    return { ...page, links: await linksRepository.findActiveByPageId(page.id) }
  },
}
