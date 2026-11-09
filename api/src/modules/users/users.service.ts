import {
  BadRequestError,
  ConflictError,
  NotFoundError,
  TooManyRequestsError,
  UnauthorizedError,
} from '../../shared/errors'
import { hashPassword, verifyPassword } from '../../shared/password'
import { authRepository } from '../auth/auth.repository'
import { authTokens } from '../auth/auth.tokens'
import { mailService } from '../mail/mail.service'
import {
  accountDeletedMessage,
  confirmDeletionMessage,
  passwordChangedMessage,
} from '../mail/mail.templates'
import { mediaStorage } from '../media/media.storage'
import { publicPageCache } from '../pages/pages.service'
import type { ChangePasswordBody } from './users.dto'
import { usersRepository } from './users.repository'

type DeletableUser = { id: string; name: string; email: string; passwordHash: string | null }

const DELETION_LINK_COOLDOWN_SECONDS = 60

export const usersService = {
  async getProfile(userId: string) {
    const user = await usersRepository.findById(userId)

    if (!user) {
      throw new NotFoundError('User not found')
    }

    return user
  },

  async changePassword(
    userId: string,
    sessionId: string,
    { currentPassword, newPassword }: ChangePasswordBody,
  ) {
    const user = await usersRepository.findWithPassword(userId)

    if (!user) throw new NotFoundError('User not found')

    if (!user.passwordHash) throw new ConflictError('Account has no password')

    if (!(await verifyPassword(currentPassword, user.passwordHash))) {
      throw new UnauthorizedError('Invalid current password')
    }

    if (newPassword === currentPassword) {
      throw new BadRequestError('New password must be different from the current one')
    }

    const passwordHash = await hashPassword(newPassword)

    const changed = await authRepository.updatePasswordRevokingOthers(
      userId,
      passwordHash,
      sessionId,
      user.passwordHash,
    )

    if (!changed) throw new UnauthorizedError('Invalid current password')

    void mailService.sendSafely({ to: user.email, ...passwordChangedMessage(user.name) })
  },

  async deleteAccount(user: DeletableUser) {
    const deleted = await usersRepository.deleteWithData(user.id, user.passwordHash)

    if (!deleted) return false

    const { page, mediaKeys } = deleted

    if (page) await publicPageCache.invalidate([page])

    const removals = await Promise.allSettled(mediaKeys.map((key) => mediaStorage.remove(key)))

    removals.forEach((removal, index) => {
      if (removal.status === 'rejected') {
        console.error('Failed to remove media object', mediaKeys[index])
      }
    })

    void mailService.sendSafely({ to: user.email, ...accountDeletedMessage(user.name) })

    return true
  },

  async requestDeletion(userId: string, password: string | undefined) {
    const user = await usersRepository.findWithPassword(userId)

    if (!user) throw new NotFoundError('User not found')

    if (!user.passwordHash) {
      const token = await authTokens.issueWithCooldown(
        user.id,
        'account_deletion',
        DELETION_LINK_COOLDOWN_SECONDS,
      )

      if (!token) throw new TooManyRequestsError()

      void mailService.sendSafely({ to: user.email, ...confirmDeletionMessage(user.name, token) })

      return { status: 'email_sent' as const }
    }

    if (!password || !(await verifyPassword(password, user.passwordHash))) {
      throw new UnauthorizedError('Invalid password')
    }

    if (!(await usersService.deleteAccount(user))) {
      throw new UnauthorizedError('Invalid password')
    }

    return { status: 'deleted' as const }
  },

  async confirmDeletion(token: string) {
    const userId = await authTokens.consume('account_deletion', token)

    const user = await usersRepository.findWithPassword(userId)

    if (!user || !(await usersService.deleteAccount(user))) {
      throw new BadRequestError('Invalid or expired token')
    }
  },
}
