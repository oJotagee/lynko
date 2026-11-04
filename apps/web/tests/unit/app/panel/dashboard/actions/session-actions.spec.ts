import { afterEach, beforeEach, describe, expect, it, mock, spyOn } from 'bun:test'

import { revalidatePath } from '../../../../support/mocks'

const authModule = await import('@/lib/auth')

const { logout } = await import('@/app/[locale]/(panel)/dashboard/_actions/logout')

const { login } = await import('@/app/[locale]/(public)/login/_actions/login')

describe('session actions', () => {
  beforeEach(() => {
    revalidatePath.mockClear()
  })

  afterEach(() => {
    mock.restore()
  })

  describe('logout', () => {
    it('signs out without redirect and revalidates every locale', async () => {
      const signOut = spyOn(authModule, 'signOut').mockResolvedValue(undefined)

      expect(await logout()).toEqual({})
      expect(signOut).toHaveBeenCalledWith({ redirect: false })
      expect(revalidatePath).toHaveBeenCalledWith('/[locale]', 'layout')
    })

    it('reports the failure without revalidating', async () => {
      spyOn(authModule, 'signOut').mockRejectedValue(new Error('Session failure'))

      expect(await logout()).toEqual({ error: 'Não foi possível sair da conta. Tente novamente.' })
      expect(revalidatePath).not.toHaveBeenCalled()
    })
  })

  describe('login', () => {
    const input = { email: 'maria@example.com', password: 'password123' }

    it('signs in with credentials and revalidates every locale', async () => {
      const signIn = spyOn(authModule, 'signIn').mockResolvedValue(undefined)

      expect(await login(input)).toEqual({})
      expect(signIn).toHaveBeenCalledWith('credentials', { ...input, redirect: false })
      expect(revalidatePath).toHaveBeenCalledWith('/[locale]', 'layout')
    })

    it('returns an error and does not revalidate when sign in fails', async () => {
      spyOn(authModule, 'signIn').mockRejectedValue(new Error('Login failed'))

      expect((await login(input)).error).toBeDefined()
      expect(revalidatePath).not.toHaveBeenCalled()
    })
  })
})
