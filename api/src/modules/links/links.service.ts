import { BadRequestError, ConflictError, NotFoundError } from '../../shared/errors'
import { toInvalidateEntry } from '../pages/pages.cache'
import { pagesRepository } from '../pages/pages.repository'
import { publicPageCache } from '../pages/pages.service'
import { type CreateLinkBody, MAX_LINKS_PER_PAGE, type UpdateLinkBody } from './links.dto'
import { linksRepository } from './links.repository'

const LINK_NOT_FOUND = 'Link not found'

async function getPageOrThrow(userId: string) {
  const page = await pagesRepository.findByUserId(userId)

  if (!page) {
    throw new NotFoundError('Page not found')
  }

  return page
}

export const linksService = {
  async list(userId: string) {
    return linksRepository.findByPageId((await getPageOrThrow(userId)).id)
  },

  async create(userId: string, data: CreateLinkBody) {
    const { id: pageId } = await getPageOrThrow(userId)

    const links = await linksRepository.findByPageId(pageId)

    if (links.length >= MAX_LINKS_PER_PAGE) {
      throw new ConflictError(`A page can have at most ${MAX_LINKS_PER_PAGE} links`)
    }

    const position = Math.max(-1, ...links.map((link) => link.position)) + 1

    const { link, page } = await linksRepository.create({ ...data, pageId, position })

    if (!link) throw new Error('Failed to create link')

    if (page) await publicPageCache.invalidate([toInvalidateEntry(page)])

    return link
  },

  async update(userId: string, id: string, changes: UpdateLinkBody) {
    const { id: pageId } = await getPageOrThrow(userId)

    const { link, page } = await linksRepository.update(id, pageId, changes)

    if (!link) {
      throw new NotFoundError(LINK_NOT_FOUND)
    }

    if (page) await publicPageCache.invalidate([toInvalidateEntry(page)])

    return link
  },

  async delete(userId: string, id: string) {
    const { id: pageId } = await getPageOrThrow(userId)

    const { link, page } = await linksRepository.delete(id, pageId)

    if (!link) {
      throw new NotFoundError(LINK_NOT_FOUND)
    }

    if (page) await publicPageCache.invalidate([toInvalidateEntry(page)])
  },

  async reorder(userId: string, linkIds: string[]) {
    const { id: pageId } = await getPageOrThrow(userId)

    const links = await linksRepository.findByPageId(pageId)

    const received = new Set(linkIds)

    const isSameSet =
      received.size === linkIds.length &&
      linkIds.length === links.length &&
      links.every((link) => received.has(link.id))

    if (!isSameSet) {
      throw new BadRequestError('linkIds must contain every link of the page exactly once')
    }

    const page = await linksRepository.reorder(pageId, linkIds)

    if (page) await publicPageCache.invalidate([toInvalidateEntry(page)])

    return linksRepository.findByPageId(pageId)
  },
}
