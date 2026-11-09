import { beforeEach, describe, expect, it, mock } from 'bun:test'
import { screen, waitFor } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'

import { PasswordVisibilityProvider } from '@/app/[locale]/(public)/_components/password-visibility'
import messages from '@/messages/pt.json'
import { resetNextMocks, router, toast } from '../../support/next'
import { renderWithProviders } from '../../support/render'

type ResetResult = { error?: string; invalid?: boolean }

const resetPassword = mock(
  async (_input: { token: string; password: string }): Promise<ResetResult> => ({}),
)

mock.module('@/app/[locale]/(public)/reset-password/_actions/reset-password', () => ({
  resetPassword,
}))

const { ResetPasswordForm } = await import(
  '@/app/[locale]/(public)/reset-password/_components/reset-password-form'
)

function renderForm(token?: string) {
  return renderWithProviders(
    <NextIntlClientProvider locale="pt" messages={messages}>
      <PasswordVisibilityProvider>
        <ResetPasswordForm token={token} />
      </PasswordVisibilityProvider>
    </NextIntlClientProvider>,
  )
}

async function fill(
  user: ReturnType<typeof renderForm>['user'],
  password: string,
  confirmation: string,
) {
  await user.type(screen.getByLabelText('Nova senha'), password)

  await user.type(screen.getByLabelText('Confirmar nova senha'), confirmation)

  await user.click(screen.getByRole('button', { name: /Redefinir senha/ }))
}

describe('ResetPasswordForm', () => {
  beforeEach(() => {
    resetNextMocks()

    resetPassword.mockClear()

    resetPassword.mockImplementation(async () => ({}))
  })

  it('resets the password with the link token and goes to the login', async () => {
    const { user } = renderForm('token-1')

    await fill(user, 'new-password-1', 'new-password-1')

    await waitFor(() =>
      expect(resetPassword).toHaveBeenCalledWith({ token: 'token-1', password: 'new-password-1' }),
    )

    await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/login'))

    expect(toast.success).toHaveBeenCalledWith('Senha redefinida. Entre com a nova senha.')
  })

  it('blocks different passwords and short passwords before calling the API', async () => {
    const { user } = renderForm('token-1')

    await fill(user, 'new-password-1', 'new-password-2')

    expect(await screen.findByText('As senhas não coincidem')).toBeInTheDocument()

    await user.clear(screen.getByLabelText('Nova senha'))

    await user.clear(screen.getByLabelText('Confirmar nova senha'))

    await fill(user, 'short', 'short')

    expect(await screen.findByText('A senha deve ter pelo menos 8 caracteres')).toBeInTheDocument()

    expect(resetPassword).not.toHaveBeenCalled()
  })

  it('offers another link when the API says the link is invalid', async () => {
    resetPassword.mockImplementation(async () => ({
      error: 'Invalid or expired token',
      invalid: true,
    }))

    const { user } = renderForm('stale')

    await fill(user, 'new-password-1', 'new-password-1')

    expect(await screen.findByText('Link inválido ou expirado')).toBeInTheDocument()

    expect(screen.getByRole('link', { name: /Pedir outro link/ })).toHaveAttribute(
      'href',
      '/forgot-password',
    )

    expect(toast.error).not.toHaveBeenCalled()

    expect(router.replace).not.toHaveBeenCalled()
  })

  it('keeps the form and shows the error on a connection failure', async () => {
    resetPassword.mockImplementation(async () => ({ error: 'Servidor indisponível' }))

    const { user } = renderForm('token-1')

    await fill(user, 'new-password-1', 'new-password-1')

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Servidor indisponível'))

    expect(screen.getByRole('button', { name: /Redefinir senha/ })).toBeEnabled()

    expect(router.replace).not.toHaveBeenCalled()
  })

  it('toggles the visibility of both password fields with the show button', async () => {
    const { user } = renderForm('token-1')

    const password = screen.getByLabelText('Nova senha')

    const confirmation = screen.getByLabelText('Confirmar nova senha')

    expect(password).toHaveAttribute('type', 'password')

    expect(confirmation).toHaveAttribute('type', 'password')

    await user.click(screen.getByRole('button', { name: 'Mostrar senha' }))

    expect(password).toHaveAttribute('type', 'text')

    expect(confirmation).toHaveAttribute('type', 'text')

    expect(screen.getByRole('button', { name: 'Ocultar senha' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('shows the invalid state with a shortcut when the link has no token', () => {
    renderForm(undefined)

    expect(screen.getByText(/Este link está incompleto/)).toBeInTheDocument()

    expect(screen.getByRole('link', { name: /Pedir outro link/ })).toBeInTheDocument()

    expect(screen.queryByLabelText('Nova senha')).not.toBeInTheDocument()
  })
})
