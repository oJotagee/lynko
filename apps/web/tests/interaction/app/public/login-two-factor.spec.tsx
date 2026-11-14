import { beforeEach, describe, expect, it, mock } from 'bun:test'
import { screen, waitFor } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'

import { PasswordVisibilityProvider } from '@/app/[locale]/(public)/_components/password-visibility'
import messages from '@/messages/pt.json'
import { resetNextMocks, router, toast } from '../../support/next'
import { renderWithProviders } from '../../support/render'

type LoginResult = { error?: string; twoFactor?: string }

type TwoFactorResult = { error?: string; expired?: boolean }

const login = mock(async (_input: object): Promise<LoginResult> => ({ twoFactor: 'challenge-1' }))

const loginTwoFactor = mock(async (_input: object): Promise<TwoFactorResult> => ({}))

const sessionApi = await import('next-auth/react')

mock.module('next-auth/react', () => ({ ...sessionApi, getSession: async () => null }))

mock.module('@/app/[locale]/(public)/login/_actions/login', () => ({ login }))

mock.module('@/app/[locale]/(public)/login/_actions/login-two-factor', () => ({
  loginTwoFactor,
}))

const { LoginForm } = await import('@/app/[locale]/(public)/login/_components/login-form')

function renderForm() {
  return renderWithProviders(
    <NextIntlClientProvider locale="pt" messages={messages}>
      <PasswordVisibilityProvider>
        <LoginForm />
      </PasswordVisibilityProvider>
    </NextIntlClientProvider>,
  )
}

async function signInWithPassword(user: ReturnType<typeof renderForm>['user']) {
  await user.type(screen.getByLabelText('E-mail'), 'maria@example.com')

  await user.type(screen.getByLabelText('Senha'), 'right-pass')

  await user.click(screen.getByRole('button', { name: /Entrar/ }))
}

describe('LoginForm with two-factor', () => {
  beforeEach(() => {
    resetNextMocks()

    login.mockClear()

    loginTwoFactor.mockClear()

    login.mockImplementation(async () => ({ twoFactor: 'challenge-1' }))

    loginTwoFactor.mockImplementation(async () => ({}))
  })

  it('goes straight to the dashboard without two-factor', async () => {
    login.mockImplementation(async () => ({}))

    const { user } = renderForm()

    await signInWithPassword(user)

    await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/dashboard'))

    expect(screen.queryByText('Verificação em duas etapas')).toBeNull()
  })

  it('asks for the app code and finishes the login', async () => {
    const { user } = renderForm()

    await signInWithPassword(user)

    expect(await screen.findByText('Verificação em duas etapas')).toBeInTheDocument()

    await user.type(screen.getByLabelText('Código do app autenticador'), '123456')

    await user.click(screen.getByRole('button', { name: /Confirmar/ }))

    await waitFor(() =>
      expect(loginTwoFactor.mock.calls[0]?.[0]).toEqual({
        challengeToken: 'challenge-1',
        code: '123456',
      }),
    )

    await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/dashboard'))
  })

  it('switches to a recovery code', async () => {
    const { user } = renderForm()

    await signInWithPassword(user)

    await user.click(await screen.findByText('Usar um código de recuperação'))

    await user.type(screen.getByLabelText('Código de recuperação'), 'abcde-fghij')

    await user.click(screen.getByRole('button', { name: /Confirmar/ }))

    await waitFor(() =>
      expect(loginTwoFactor.mock.calls[0]?.[0]).toEqual({
        challengeToken: 'challenge-1',
        recoveryCode: 'abcde-fghij',
      }),
    )
  })

  it('shows the error for a wrong code and stays on the step', async () => {
    loginTwoFactor.mockImplementation(async () => ({
      error: 'Código inválido. Confira e tente de novo.',
    }))

    const { user } = renderForm()

    await signInWithPassword(user)

    await user.type(await screen.findByLabelText('Código do app autenticador'), '000000')

    await user.click(screen.getByRole('button', { name: /Confirmar/ }))

    expect(await screen.findByText('Código inválido. Confira e tente de novo.')).toBeInTheDocument()

    expect(router.replace).not.toHaveBeenCalled()
  })

  it('goes back to e-mail and password when the challenge expires', async () => {
    loginTwoFactor.mockImplementation(async () => ({
      error: 'O tempo para digitar o código acabou. Entre de novo.',
      expired: true,
    }))

    const { user } = renderForm()

    await signInWithPassword(user)

    await user.type(await screen.findByLabelText('Código do app autenticador'), '123456')

    await user.click(screen.getByRole('button', { name: /Confirmar/ }))

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        'O tempo para digitar o código acabou. Entre de novo.',
      ),
    )

    expect(await screen.findByLabelText('E-mail')).toBeInTheDocument()
  })
})
