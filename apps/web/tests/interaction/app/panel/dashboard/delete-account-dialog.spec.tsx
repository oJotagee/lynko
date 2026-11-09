import { beforeEach, describe, expect, it, mock } from 'bun:test'
import { screen, waitFor } from '@testing-library/react'

import { resetNextMocks, router, toast } from '../../../support/next'
import { renderWithProviders } from '../../../support/render'

type DeleteResult = { data?: { deleted: true } | { emailSent: true }; error?: string }

const deleteAccount = mock(
  async (_input: { password?: string }): Promise<DeleteResult> => ({
    data: { deleted: true },
  }),
)

mock.module('@/app/[locale]/(panel)/dashboard/_actions/delete-account', () => ({
  deleteAccount,
}))

const { DeleteAccountDialog } = await import(
  '@/app/[locale]/(panel)/dashboard/settings/_components/delete-account-dialog'
)

describe('DeleteAccountDialog', () => {
  beforeEach(() => {
    resetNextMocks()

    deleteAccount.mockClear()

    deleteAccount.mockImplementation(async () => ({ data: { deleted: true } }))
  })

  it('asks for the password, deletes the account and leaves the dashboard', async () => {
    const { user } = renderWithProviders(<DeleteAccountDialog hasPassword />)

    await user.click(screen.getByRole('button', { name: 'Excluir conta' }))

    expect(await screen.findByText(/imediato e não pode ser desfeito/)).toBeInTheDocument()

    await user.type(screen.getByLabelText('Sua senha'), 'right-password')

    await user.click(screen.getByRole('button', { name: 'Excluir minha conta' }))

    await waitFor(() => expect(deleteAccount).toHaveBeenCalledWith({ password: 'right-password' }))

    await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/'))

    expect(toast.success).toHaveBeenCalledWith('Sua conta foi excluída.')
  })

  it('does not call the API without a password', async () => {
    const { user } = renderWithProviders(<DeleteAccountDialog hasPassword />)

    await user.click(screen.getByRole('button', { name: 'Excluir conta' }))

    await user.click(await screen.findByRole('button', { name: 'Excluir minha conta' }))

    expect(await screen.findByText('Informe sua senha para confirmar')).toBeInTheDocument()

    expect(deleteAccount).not.toHaveBeenCalled()
  })

  it('shows the wrong password error and keeps the account and the dialog', async () => {
    deleteAccount.mockImplementation(async () => ({ error: 'Senha incorreta.' }))

    const { user } = renderWithProviders(<DeleteAccountDialog hasPassword />)

    await user.click(screen.getByRole('button', { name: 'Excluir conta' }))

    await user.type(await screen.findByLabelText('Sua senha'), 'wrong-password')

    await user.click(screen.getByRole('button', { name: 'Excluir minha conta' }))

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Senha incorreta.'))

    expect(router.replace).not.toHaveBeenCalled()

    expect(screen.getByLabelText('Sua senha')).toBeInTheDocument()
  })

  it('sends a confirmation link to a Google account without asking for a password', async () => {
    deleteAccount.mockImplementation(async () => ({ data: { emailSent: true } }))

    const { user } = renderWithProviders(<DeleteAccountDialog hasPassword={false} />)

    await user.click(screen.getByRole('button', { name: 'Excluir conta' }))

    expect(screen.queryByLabelText('Sua senha')).not.toBeInTheDocument()

    await user.click(await screen.findByRole('button', { name: 'Enviar link de confirmação' }))

    expect(await screen.findByText('Verifique seu e-mail')).toBeInTheDocument()

    expect(deleteAccount).toHaveBeenCalledWith({ password: undefined })

    expect(router.replace).not.toHaveBeenCalled()
  })
})
