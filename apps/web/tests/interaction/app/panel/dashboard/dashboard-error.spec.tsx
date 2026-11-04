import { beforeEach, describe, expect, it, mock } from 'bun:test'
import { screen, waitFor } from '@testing-library/react'

import { resetNextMocks, router, toast } from '../../../support/next'
import { renderWithProviders } from '../../../support/render'

type ActionResult = { error?: string }

const logout = mock(async (): Promise<ActionResult> => ({}))

mock.module('@/app/[locale]/(panel)/dashboard/_actions/logout', () => ({ logout }))

const { default: DashboardError } = await import('@/app/[locale]/(panel)/dashboard/error')

describe('DashboardError', () => {
  const retry = mock(() => undefined)

  beforeEach(() => {
    resetNextMocks()

    logout.mockClear()
    logout.mockImplementation(async () => ({}))

    retry.mockClear()
  })

  it('offers a retry for an ordinary failure and keeps the session', async () => {
    const { user } = renderWithProviders(<DashboardError error={new Error('boom')} retry={retry} />)

    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }))

    expect(retry).toHaveBeenCalledTimes(1)
    expect(logout).not.toHaveBeenCalled()
    expect(router.replace).not.toHaveBeenCalled()
  })

  it('ends the local session and goes to the login when the API dropped the session', async () => {
    const error = Object.assign(new Error('omitido em produção'), { digest: 'SESSION_EXPIRED' })

    renderWithProviders(<DashboardError error={error} retry={retry} />)

    expect(screen.getByRole('heading', { name: 'Sua sessão expirou' })).toBeInTheDocument()

    await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/login'))

    expect(logout).toHaveBeenCalledTimes(1)
    expect(router.refresh).toHaveBeenCalled()
  })

  it('does not leave for the login when the local sign-out fails, to avoid a loop', async () => {
    logout.mockImplementation(async () => ({ error: 'Não foi possível sair da conta.' }))

    const error = Object.assign(new Error('x'), { digest: 'SESSION_EXPIRED' })

    renderWithProviders(<DashboardError error={error} retry={retry} />)

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Não foi possível sair da conta.'))

    expect(router.replace).not.toHaveBeenCalled()
  })
})
