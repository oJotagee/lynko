import { beforeEach, describe, expect, it, mock } from 'bun:test'
import { screen, waitFor } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'

import messages from '@/messages/pt.json'
import { resetNextMocks, toast } from '../../support/next'
import { renderWithProviders } from '../../support/render'

const forgotPassword = mock(async (_email: string): Promise<{ error?: string }> => ({}))

mock.module('@/app/[locale]/(public)/forgot-password/_actions/forgot-password', () => ({
  forgotPassword,
}))

const { ForgotPasswordForm } = await import(
  '@/app/[locale]/(public)/forgot-password/_components/forgot-password-form'
)

function renderForm() {
  return renderWithProviders(
    <NextIntlClientProvider locale="pt" messages={messages}>
      <ForgotPasswordForm />
    </NextIntlClientProvider>,
  )
}

describe('ForgotPasswordForm', () => {
  beforeEach(() => {
    resetNextMocks()

    forgotPassword.mockClear()

    forgotPassword.mockImplementation(async () => ({}))
  })

  it.each(['maria@example.com', 'nobody@example.com'])(
    'shows the same confirmation for %s',
    async (email) => {
      const { user } = renderForm()

      await user.type(screen.getByLabelText('E-mail'), email)

      await user.click(screen.getByRole('button', { name: /Enviar link/ }))

      expect(await screen.findByText('Verifique seu e-mail')).toBeInTheDocument()

      expect(screen.getByText(/Se existir uma conta com senha/)).toBeInTheDocument()

      expect(forgotPassword).toHaveBeenCalledWith(email)

      expect(screen.queryByRole('button', { name: /Enviar link/ })).not.toBeInTheDocument()
    },
  )

  it('validates the e-mail before calling the API', async () => {
    const { user } = renderForm()

    await user.type(screen.getByLabelText('E-mail'), 'invalid')

    await user.click(screen.getByRole('button', { name: /Enviar link/ }))

    expect(await screen.findByText('Informe um endereço de e-mail válido')).toBeInTheDocument()

    expect(forgotPassword).not.toHaveBeenCalled()
  })

  it('shows the error and keeps the form when the request fails', async () => {
    forgotPassword.mockImplementation(async () => ({
      error: 'Muitas tentativas em pouco tempo. Aguarde um instante e tente novamente.',
    }))

    const { user } = renderForm()

    await user.type(screen.getByLabelText('E-mail'), 'maria@example.com')

    await user.click(screen.getByRole('button', { name: /Enviar link/ }))

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        'Muitas tentativas em pouco tempo. Aguarde um instante e tente novamente.',
      ),
    )

    expect(screen.queryByText('Verifique seu e-mail')).not.toBeInTheDocument()

    expect(screen.getByRole('button', { name: /Enviar link/ })).toBeEnabled()
  })
})
