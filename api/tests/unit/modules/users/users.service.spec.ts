import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'
import { usersService } from '../../../../src/modules/users/users.service'
import { NotFoundError } from '../../../../src/shared/errors'
import { buildUser } from '../../support/builders'
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

  it('throws NotFoundError for an unknown user', async () => {
    await expect(usersService.getProfile(crypto.randomUUID())).rejects.toBeInstanceOf(NotFoundError)
  })
})
