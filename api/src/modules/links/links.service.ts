import { type CreateLinkBody, MAX_LINKS_PER_PAGE, type UpdateLinkBody } from './links.dto'
import { BadRequestError, ConflictError, NotFoundError } from '../../shared/errors'
import { pagesRepository } from '../pages/pages.repository'
import { linksRepository } from './links.repository'

const LINK_NOT_FOUND = 'Link not found'

async function getPageIdOrThrow(userId: string) {
  const page = await pagesRepository.findByUserId(userId)

  if (!page) {
    throw new NotFoundError('Page not found')
  }

  return page.id
}

export const linksService = {
  async list(userId: string) {
    return linksRepository.findByPageId(await getPageIdOrThrow(userId))
  },

  async create(userId: string, data: CreateLinkBody) {
    const pageId = await getPageIdOrThrow(userId)
    const links = await linksRepository.findByPageId(pageId)

    if (links.length >= MAX_LINKS_PER_PAGE) {
      throw new ConflictError(`A page can have at most ${MAX_LINKS_PER_PAGE} links`)
    }

    const position = Math.max(-1, ...links.map((link) => link.position)) + 1
    const link = await linksRepository.create({ ...data, pageId, position })
    if (!link) throw new Error('Failed to create link')

    return link
  },

  async update(userId: string, id: string, changes: UpdateLinkBody) {
    const link = await linksRepository.update(id, await getPageIdOrThrow(userId), changes)

    if (!link) {
      throw new NotFoundError(LINK_NOT_FOUND)
    }

    return link
  },

  async delete(userId: string, id: string) {
    const deleted = await linksRepository.delete(id, await getPageIdOrThrow(userId))

    if (!deleted) {
      throw new NotFoundError(LINK_NOT_FOUND)
    }
  },

  async reorder(userId: string, linkIds: string[]) {
    const pageId = await getPageIdOrThrow(userId)
    const links = await linksRepository.findByPageId(pageId)

    const received = new Set(linkIds)
    const isSameSet =
      received.size === linkIds.length &&
      linkIds.length === links.length &&
      links.every((link) => received.has(link.id))

    if (!isSameSet) {
      throw new BadRequestError('linkIds must contain every link of the page exactly once')
    }

    await linksRepository.reorder(pageId, linkIds)

    return linksRepository.findByPageId(pageId)
  },
}
