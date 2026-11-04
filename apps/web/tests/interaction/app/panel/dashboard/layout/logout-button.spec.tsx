import { beforeEach, describe, expect, it, mock } from 'bun:test'
import { screen, waitFor } from '@testing-library/react'

import { resetNextMocks, router, toast } from '../../../../support/next'
import { renderWithProviders } from '../../../../support/render'

type ActionResult = { error?: string }

const logout = mock(async (): Promise<ActionResult> => ({}))

const sessionApi = await import('next-auth/react')

mock.module('@/app/[locale]/(panel)/dashboard/_actions/logout', () => ({ logout }))
mock.module('next-auth/react', () => ({ ...sessionApi, getSession: async () => null }))

const { LogoutButton } = await import(
  '@/app/[locale]/(panel)/dashboard/_components/layout/logout-button'
)

describe('LogoutButton', () => {
  beforeEach(() => {
    resetNextMocks()

    logout.mockClear()
    logout.mockImplementation(async () => ({}))
  })

  it('announces the logout and goes back to the home page', async () => {
    const { user } = renderWithProviders(<LogoutButton />)

    await user.click(screen.getByRole('button', { name: /Sair da conta/ }))

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Você saiu da conta'))

    expect(router.replace).toHaveBeenCalledWith('/')
  })

  it('shows the error and stays on the page when the logout fails', async () => {
    logout.mockImplementation(async () => ({ error: 'Não foi possível sair da conta.' }))

    const { user } = renderWithProviders(<LogoutButton />)

    await user.click(screen.getByRole('button', { name: /Sair da conta/ }))

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Não foi possível sair da conta.'))

    expect(toast.success).not.toHaveBeenCalled()
    expect(router.replace).not.toHaveBeenCalled()
  })
})
