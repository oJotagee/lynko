import { afterEach, beforeEach, describe, expect, it, mock, setSystemTime, spyOn } from 'bun:test'
import { authTokens } from '../../../../src/modules/auth/auth.tokens'
import { mediaStorage } from '../../../../src/modules/media/media.storage'
import { publicPageCache } from '../../../../src/modules/pages/pages.service'
import { usersRepository } from '../../../../src/modules/users/users.repository'
import { usersService } from '../../../../src/modules/users/users.service'
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
  TooManyRequestsError,
  UnauthorizedError,
} from '../../../../src/shared/errors'
import { hashPassword, verifyPassword } from '../../../../src/shared/password'
import { buildLink, buildMedia, buildPage, buildSession, buildUser } from '../../support/builders'
import { useInMemoryRepositories } from '../../support/memory-repositories'

describe('usersService', () => {
  let store: ReturnType<typeof useInMemoryRepositories>

  beforeEach(() => {
    store = useInMemoryRepositories()
  })

  afterEach(() => {
    mock.restore()
  })

  it('returns the profile without the password hash', async () => {
    const user = buildUser()

    store.users.push(user)

    const profile = await usersService.getProfile(user.id)

    expect(profile).toMatchObject({ id: user.id, email: user.email })
    expect(profile).not.toHaveProperty('passwordHash')
  })

  it('computes the account flags', async () => {
    const password = buildUser({ email: 'a@example.com' })

    const google = buildUser({
      email: 'b@example.com',
      passwordHash: null,
      googleId: 'google-id',
      emailVerifiedAt: new Date(),
    })

    store.users.push(password, google)

    expect(await usersService.getProfile(password.id)).toMatchObject({
      hasPassword: true,
      hasGoogle: false,
      emailVerified: false,
    })

    expect(await usersService.getProfile(google.id)).toMatchObject({
      hasPassword: false,
      hasGoogle: true,
      emailVerified: true,
    })
  })

  it('throws NotFoundError for an unknown user', async () => {
    await expect(usersService.getProfile(crypto.randomUUID())).rejects.toBeInstanceOf(NotFoundError)
  })

  describe('changePassword', () => {
    let user: ReturnType<typeof buildUser>

    let current: ReturnType<typeof buildSession>

    let other: ReturnType<typeof buildSession>

    beforeEach(async () => {
      user = buildUser({ passwordHash: await hashPassword('old-password') })

      current = buildSession({ userId: user.id })

      other = buildSession({ userId: user.id })

      store.users.push(user)

      store.sessions.push(current, other)
    })

    it('changes the password, keeps the current session, revokes the others and notifies', async () => {
      await usersService.changePassword(user.id, current.id, {
        currentPassword: 'old-password',
        newPassword: 'new-password-1',
      })

      await Bun.sleep(0)

      expect(await verifyPassword('new-password-1', user.passwordHash)).toBe(true)

      expect(current.revokedAt).toBeNull()

      expect(other.revokedAt).toBeInstanceOf(Date)

      expect(store.mails).toHaveLength(1)

      expect(store.mails[0]?.to).toBe(user.email)

      expect(store.mails[0]?.subject).toContain('alterada')
    })

    it('rejects a wrong current password without changing anything', async () => {
      const before = user.passwordHash

      await expect(
        usersService.changePassword(user.id, current.id, {
          currentPassword: 'wrong-password',
          newPassword: 'new-password-1',
        }),
      ).rejects.toBeInstanceOf(UnauthorizedError)

      expect(user.passwordHash).toBe(before)

      expect(other.revokedAt).toBeNull()

      expect(store.mails).toHaveLength(0)
    })

    it('rejects a new password equal to the current one', async () => {
      await expect(
        usersService.changePassword(user.id, current.id, {
          currentPassword: 'old-password',
          newPassword: 'old-password',
        }),
      ).rejects.toBeInstanceOf(BadRequestError)
    })

    it('rejects an account without a password', async () => {
      const google = buildUser({ email: 'google@example.com', passwordHash: null })

      store.users.push(google)

      await expect(
        usersService.changePassword(google.id, current.id, {
          currentPassword: 'old-password',
          newPassword: 'new-password-1',
        }),
      ).rejects.toBeInstanceOf(ConflictError)
    })

    it('throws NotFoundError for an unknown user', async () => {
      await expect(
        usersService.changePassword(crypto.randomUUID(), current.id, {
          currentPassword: 'old-password',
          newPassword: 'new-password-1',
        }),
      ).rejects.toBeInstanceOf(NotFoundError)
    })

    it('rejects when the password changed after it was checked', async () => {
      const stale = user.passwordHash

      spyOn(usersRepository, 'findWithPassword').mockImplementation(async () => {
        const snapshot = { ...user, passwordHash: stale }

        user.passwordHash = await hashPassword('reset-by-someone-else')

        return snapshot
      })

      await expect(
        usersService.changePassword(user.id, current.id, {
          currentPassword: 'old-password',
          newPassword: 'new-password-1',
        }),
      ).rejects.toBeInstanceOf(UnauthorizedError)

      expect(await verifyPassword('reset-by-someone-else', user.passwordHash)).toBe(true)

      expect(other.revokedAt).toBeNull()

      expect(current.revokedAt).toBeNull()

      await Bun.sleep(0)

      expect(store.mails).toHaveLength(0)
    })
  })

  describe('requestDeletion', () => {
    let user: ReturnType<typeof buildUser>

    let remove: ReturnType<typeof spyOn>

    let invalidate: ReturnType<typeof spyOn>

    beforeEach(async () => {
      user = buildUser({ passwordHash: await hashPassword('right-password') })

      store.users.push(user, buildUser({ email: 'other@example.com' }))

      remove = spyOn(mediaStorage, 'remove').mockResolvedValue(undefined)

      invalidate = spyOn(publicPageCache, 'invalidate')
    })

    function seedData() {
      const page = buildPage({ userId: user.id, username: 'maria' })

      const media = buildMedia({ pageId: page.id })

      store.pages.push(page)

      store.links.push(buildLink({ pageId: page.id }))

      store.media.push(media)

      store.sessions.push(buildSession({ userId: user.id }))

      store.analytics.views.push({ pageId: page.id, date: '2026-01-01', count: 3 })

      store.analytics.links.push({
        pageId: page.id,
        linkId: store.links[0]?.id ?? '',
        date: '2026-01-01',
        count: 1,
      })

      store.analytics.social.push({ pageId: page.id, platform: 'x', date: '2026-01-01', count: 1 })

      return { page, media }
    }

    it('deletes the account with all of its data and cleans up', async () => {
      const { page, media } = seedData()

      const bystander = buildPage({ username: 'joao' })

      store.pages.push(bystander)

      await usersService.requestDeletion(user.id, 'right-password')

      await Bun.sleep(0)

      expect(store.users.map((item) => item.email)).toEqual(['other@example.com'])

      expect(store.sessions).toHaveLength(0)

      expect(store.links).toHaveLength(0)

      expect(store.media).toHaveLength(0)

      expect(store.analytics.views).toHaveLength(0)

      expect(store.analytics.links).toHaveLength(0)

      expect(store.analytics.social).toHaveLength(0)

      expect(store.pages).toEqual([bystander])

      expect(invalidate).toHaveBeenCalledWith([{ username: 'maria', revision: page.revision }])

      expect(remove).toHaveBeenCalledWith(media.key)

      expect(store.mails).toHaveLength(1)

      expect(store.mails[0]?.to).toBe(user.email)
    })

    it('deletes an account that has no page', async () => {
      await usersService.requestDeletion(user.id, 'right-password')

      expect(store.users.map((item) => item.email)).toEqual(['other@example.com'])

      expect(invalidate).not.toHaveBeenCalled()

      expect(remove).not.toHaveBeenCalled()
    })

    it('rejects a wrong or missing password without deleting anything', async () => {
      seedData()

      await expect(usersService.requestDeletion(user.id, 'wrong-password')).rejects.toBeInstanceOf(
        UnauthorizedError,
      )

      await expect(usersService.requestDeletion(user.id, undefined)).rejects.toBeInstanceOf(
        UnauthorizedError,
      )

      expect(store.users).toHaveLength(2)

      expect(store.pages).toHaveLength(1)

      expect(remove).not.toHaveBeenCalled()

      expect(store.mails).toHaveLength(0)
    })

    it('refuses to delete when the password changed after it was checked', async () => {
      seedData()

      const stale = user.passwordHash

      spyOn(usersRepository, 'findWithPassword').mockImplementation(async () => {
        const snapshot = { ...user, passwordHash: stale }

        user.passwordHash = await hashPassword('reset-by-someone-else')

        return snapshot
      })

      await expect(usersService.requestDeletion(user.id, 'right-password')).rejects.toBeInstanceOf(
        UnauthorizedError,
      )

      await Bun.sleep(0)

      expect(store.users).toHaveLength(2)

      expect(store.pages).toHaveLength(1)

      expect(store.links).toHaveLength(1)

      expect(store.media).toHaveLength(1)

      expect(store.analytics.views).toHaveLength(1)

      expect(store.sessions).toHaveLength(1)

      expect(invalidate).not.toHaveBeenCalled()

      expect(remove).not.toHaveBeenCalled()

      expect(store.mails).toHaveLength(0)
    })

    it('keeps the deletion when the storage fails', async () => {
      seedData()

      remove.mockRejectedValue(new Error('s3 down'))

      spyOn(console, 'error').mockImplementation(() => {})

      await expect(usersService.requestDeletion(user.id, 'right-password')).resolves.toEqual({
        status: 'deleted',
      })

      expect(store.users.map((item) => item.email)).toEqual(['other@example.com'])
    })

    describe('account without a password', () => {
      let google: ReturnType<typeof buildUser>

      beforeEach(() => {
        google = buildUser({ email: 'google@example.com', passwordHash: null })

        store.users.push(google)
      })

      function lastToken() {
        const text = store.mails.at(-1)?.text ?? ''

        return decodeURIComponent(/token=(\S+)/.exec(text)?.[1] ?? '')
      }

      afterEach(() => {
        setSystemTime()
      })

      it('e-mails a confirmation link and deletes nothing yet', async () => {
        await expect(usersService.requestDeletion(google.id, undefined)).resolves.toEqual({
          status: 'email_sent',
        })

        await Bun.sleep(0)

        expect(store.users).toHaveLength(3)

        expect(store.mails).toHaveLength(1)

        expect(store.mails[0]?.to).toBe('google@example.com')

        expect(store.mails[0]?.text).toContain('/confirm-deletion?token=')

        expect(remove).not.toHaveBeenCalled()
      })

      it('answers 429 when asked again within 60 seconds', async () => {
        await usersService.requestDeletion(google.id, undefined)

        await expect(usersService.requestDeletion(google.id, undefined)).rejects.toBeInstanceOf(
          TooManyRequestsError,
        )
      })

      it('deletes everything when the link is confirmed', async () => {
        const page = buildPage({ userId: google.id, username: 'google-user' })

        store.pages.push(page, buildPage({ username: 'bystander' }))

        store.media.push(buildMedia({ pageId: page.id }))

        await usersService.requestDeletion(google.id, undefined)

        await Bun.sleep(0)

        await usersService.confirmDeletion(lastToken())

        await Bun.sleep(0)

        expect(store.users.map((item) => item.email)).toEqual([user.email, 'other@example.com'])

        expect(store.pages.map((item) => item.username)).toEqual(['bystander'])

        expect(store.media).toHaveLength(0)

        expect(invalidate).toHaveBeenCalledWith([
          { username: 'google-user', revision: page.revision },
        ])

        expect(remove).toHaveBeenCalledTimes(1)

        expect(store.mails.at(-1)?.subject).toContain('excluída')
      })

      it('rejects a used link', async () => {
        await usersService.requestDeletion(google.id, undefined)

        await Bun.sleep(0)

        const token = lastToken()

        await usersService.confirmDeletion(token)

        await expect(usersService.confirmDeletion(token)).rejects.toBeInstanceOf(BadRequestError)
      })

      it('rejects an expired link and keeps the account', async () => {
        await usersService.requestDeletion(google.id, undefined)

        await Bun.sleep(0)

        const token = lastToken()

        setSystemTime(new Date(Date.now() + 31 * 60 * 1000))

        await expect(usersService.confirmDeletion(token)).rejects.toBeInstanceOf(BadRequestError)

        expect(store.users).toHaveLength(3)
      })

      it('invalidates the previous link when a new one is requested', async () => {
        await usersService.requestDeletion(google.id, undefined)

        await Bun.sleep(0)

        const previous = lastToken()

        setSystemTime(new Date(Date.now() + 61 * 1000))

        await usersService.requestDeletion(google.id, undefined)

        await Bun.sleep(0)

        await expect(usersService.confirmDeletion(previous)).rejects.toBeInstanceOf(BadRequestError)

        await usersService.confirmDeletion(lastToken())

        expect(store.users).toHaveLength(2)
      })

      it('does not accept a link of another type', async () => {
        const token = await authTokens.issue(google.id, 'password_reset')

        await expect(usersService.confirmDeletion(token)).rejects.toBeInstanceOf(BadRequestError)

        expect(store.users).toHaveLength(3)
      })
    })

    it('throws NotFoundError for an unknown user', async () => {
      await expect(
        usersService.requestDeletion(crypto.randomUUID(), 'right-password'),
      ).rejects.toBeInstanceOf(NotFoundError)
    })
  })
})
