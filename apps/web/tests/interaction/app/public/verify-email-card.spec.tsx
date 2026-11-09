import { beforeEach, describe, expect, it, mock } from 'bun:test'
import { screen, waitFor } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'

import messages from '@/messages/pt.json'
import { resetNextMocks } from '../../support/next'
import { renderWithProviders } from '../../support/render'

const verifyEmail = mock(
  async (_token: string): Promise<{ error?: string; invalid?: boolean }> => ({}),
)

mock.module('@/app/[locale]/(public)/verify-email/_actions/verify-email', () => ({ verifyEmail }))

const { VerifyEmailCard } = await import(
  '@/app/[locale]/(public)/verify-email/_components/verify-email-card'
)

function renderCard(token?: string) {
  return renderWithProviders(
    <NextIntlClientProvider locale="pt" messages={messages}>
      <VerifyEmailCard token={token} />
    </NextIntlClientProvider>,
  )
}

describe('VerifyEmailCard', () => {
  beforeEach(() => {
    resetNextMocks()

    verifyEmail.mockClear()

    verifyEmail.mockImplementation(async () => ({}))
  })

  it('does not consume the token on load, only on the click', async () => {
    const { user } = renderCard('token-1')

    expect(verifyEmail).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: /Confirmar e-mail/ }))

    await waitFor(() => expect(verifyEmail).toHaveBeenCalledWith('token-1'))

    expect(await screen.findByText('E-mail confirmado')).toBeInTheDocument()

    expect(screen.getByRole('link', { name: /Ir para o painel/ })).toHaveAttribute(
      'href',
      '/dashboard',
    )
  })

  it('tells the user to ask for a new e-mail when the link is invalid', async () => {
    verifyEmail.mockImplementation(async () => ({
      error: 'Invalid or expired token',
      invalid: true,
    }))

    const { user } = renderCard('stale')

    await user.click(screen.getByRole('button', { name: /Confirmar e-mail/ }))

    expect(await screen.findByText('Não foi possível confirmar')).toBeInTheDocument()

    expect(screen.getByText(/peça um novo e-mail de confirmação/)).toBeInTheDocument()

    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('keeps the link usable and allows a retry on a connection or server failure', async () => {
    verifyEmail.mockImplementationOnce(async () => ({ error: 'Servidor indisponível' }))

    const { user } = renderCard('token-1')

    await user.click(screen.getByRole('button', { name: /Confirmar e-mail/ }))

    expect(await screen.findByText('Não deu para confirmar agora')).toBeInTheDocument()

    expect(screen.getByText(/não conseguimos confirmar o resultado/)).toBeInTheDocument()

    expect(screen.queryByText(/continua válido/)).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Confirmar e-mail/ }))

    expect(await screen.findByText('E-mail confirmado')).toBeInTheDocument()

    expect(verifyEmail).toHaveBeenCalledTimes(2)
  })

  it('shows an error without a button when the link has no token', () => {
    renderCard(undefined)

    expect(screen.getByText(/Este link está incompleto/)).toBeInTheDocument()

    expect(screen.queryByRole('button')).not.toBeInTheDocument()

    expect(verifyEmail).not.toHaveBeenCalled()
  })
})
