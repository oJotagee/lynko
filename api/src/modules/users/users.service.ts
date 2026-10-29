import { NotFoundError } from '../../shared/errors'
import { usersRepository } from './users.repository'

export const usersService = {
  async getProfile(userId: string) {
    const user = await usersRepository.findById(userId)

    if (!user) {
      throw new NotFoundError('User not found')
    }

    return user
  },
}
