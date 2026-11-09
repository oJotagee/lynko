import { beforeEach, describe, expect, it, mock } from 'bun:test'
import { screen, waitFor } from '@testing-library/react'

import { resetNextMocks, toast } from '../../../support/next'
import { renderWithProviders } from '../../../support/render'

type ActionResult = { data?: true; error?: string }

const changePassword = mock(
  async (_input: { currentPassword: string; newPassword: string }): Promise<ActionResult> => ({
    data: true,
  }),
)

mock.module('@/app/[locale]/(panel)/dashboard/_actions/change-password', () => ({
  changePassword,
}))

const { ChangePasswordForm } = await import(
  '@/app/[locale]/(panel)/dashboard/settings/_components/change-password-form'
)

async function fill(
  user: ReturnType<typeof renderWithProviders>['user'],
  values: { current: string; next: string; confirmation: string },
) {
  await user.type(screen.getByLabelText('Senha atual'), values.current)

  await user.type(screen.getByLabelText('Nova senha'), values.next)

  await user.type(screen.getByLabelText('Confirmar nova senha'), values.confirmation)

  await user.click(screen.getByRole('button', { name: 'Alterar senha' }))
}

describe('ChangePasswordForm', () => {
  beforeEach(() => {
    resetNextMocks()

    changePassword.mockClear()

    changePassword.mockImplementation(async () => ({ data: true }))
  })

  it('changes the password, announces it and clears the fields', async () => {
    const { user } = renderWithProviders(<ChangePasswordForm />)

    await fill(user, {
      current: 'old-password',
      next: 'new-password-1',
      confirmation: 'new-password-1',
    })

    await waitFor(() =>
      expect(changePassword).toHaveBeenCalledWith({
        currentPassword: 'old-password',
        newPassword: 'new-password-1',
      }),
    )

    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith(
        'Senha alterada. Os outros dispositivos foram desconectados.',
      ),
    )

    expect(screen.getByLabelText('Senha atual')).toHaveValue('')

    expect(screen.getByLabelText('Nova senha')).toHaveValue('')
  })

  it('shows the API error and keeps the typed values', async () => {
    changePassword.mockImplementation(async () => ({ error: 'A senha atual está incorreta.' }))

    const { user } = renderWithProviders(<ChangePasswordForm />)

    await fill(user, {
      current: 'wrong-password',
      next: 'new-password-1',
      confirmation: 'new-password-1',
    })

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('A senha atual está incorreta.'))

    expect(toast.success).not.toHaveBeenCalled()

    expect(screen.getByLabelText('Senha atual')).toHaveValue('wrong-password')
  })

  it('blocks a mismatched confirmation before calling the API', async () => {
    const { user } = renderWithProviders(<ChangePasswordForm />)

    await fill(user, {
      current: 'old-password',
      next: 'new-password-1',
      confirmation: 'new-password-2',
    })

    expect(await screen.findByText('As senhas não coincidem')).toBeInTheDocument()

    expect(changePassword).not.toHaveBeenCalled()
  })

  it('shows and hides the three passwords with one button', async () => {
    const { user } = renderWithProviders(<ChangePasswordForm />)

    await user.click(screen.getByRole('button', { name: 'Mostrar senhas' }))

    for (const label of ['Senha atual', 'Nova senha', 'Confirmar nova senha']) {
      expect(screen.getByLabelText(label)).toHaveAttribute('type', 'text')
    }

    expect(screen.getByRole('button', { name: 'Ocultar senhas' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })
})
