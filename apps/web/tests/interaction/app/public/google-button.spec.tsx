import { beforeEach, describe, expect, it, mock } from 'bun:test'
import { screen, waitFor } from '@testing-library/react'

import { resetNextMocks, toast } from '../../support/next'
import { renderWithProviders } from '../../support/render'

const loginWithGoogle = mock(async (): Promise<{ error?: string }> => ({}))

mock.module('@/app/[locale]/(public)/login/_actions/login-with-google', () => ({
  loginWithGoogle,
}))

const { GoogleButton } = await import('@/app/[locale]/(public)/_components/google-button')

describe('GoogleButton', () => {
  beforeEach(() => {
    resetNextMocks()

    loginWithGoogle.mockClear()

    loginWithGoogle.mockImplementation(async () => ({}))
  })

  it('does not show an error when Next rejects the action with the redirect to Google', async () => {
    loginWithGoogle.mockImplementation(async () => {
      throw Object.assign(new Error('NEXT_REDIRECT'), {
        digest: 'NEXT_REDIRECT;push;https://accounts.google.com/o/oauth2/v2/auth;307;',
      })
    })

    const { user } = renderWithProviders(<GoogleButton>Continuar com Google</GoogleButton>)

    await user.click(screen.getByRole('button', { name: /Continuar com Google/ }))

    await waitFor(() => expect(loginWithGoogle).toHaveBeenCalledTimes(1))

    await waitFor(() => expect(screen.getByRole('button')).toBeEnabled())

    expect(toast.error).not.toHaveBeenCalled()
  })

  it('shows the error when the action fails for another reason', async () => {
    loginWithGoogle.mockImplementation(async () => {
      throw new Error('boom')
    })

    const { user } = renderWithProviders(<GoogleButton>Continuar com Google</GoogleButton>)

    await user.click(screen.getByRole('button', { name: /Continuar com Google/ }))

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        'Não foi possível entrar com o Google. Tente novamente.',
      ),
    )
  })

  it('shows the message returned by the action', async () => {
    loginWithGoogle.mockImplementation(async () => ({ error: 'Não foi possível entrar agora.' }))

    const { user } = renderWithProviders(<GoogleButton>Continuar com Google</GoogleButton>)

    await user.click(screen.getByRole('button', { name: /Continuar com Google/ }))

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Não foi possível entrar agora.'))
  })
})
