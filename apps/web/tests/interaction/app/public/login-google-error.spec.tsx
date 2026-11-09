import { describe, expect, it, mock } from 'bun:test'
import { screen } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'

import { PasswordVisibilityProvider } from '@/app/[locale]/(public)/_components/password-visibility'
import messages from '@/messages/pt.json'
import '../../support/next'
import { renderWithProviders } from '../../support/render'

mock.module('@/app/[locale]/(public)/login/_actions/login', () => ({
  login: mock(async () => ({})),
}))

mock.module('@/app/[locale]/(public)/login/_actions/login-with-google', () => ({
  loginWithGoogle: mock(async () => ({})),
}))

const { AuthCard } = await import('@/app/[locale]/(public)/login/_components/auth-card')

function renderCard(googleError?: boolean) {
  return renderWithProviders(
    <NextIntlClientProvider locale="pt" messages={messages}>
      <PasswordVisibilityProvider>
        <AuthCard googleError={googleError} />
      </PasswordVisibilityProvider>
    </NextIntlClientProvider>,
  )
}

describe('AuthCard Google error', () => {
  it('shows an alert when the Google sign-in was refused', () => {
    renderCard(true)

    expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível entrar com o Google')
  })

  it('shows no alert on a normal visit', () => {
    renderCard()

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
