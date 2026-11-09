import { beforeEach, describe, expect, it, mock } from 'bun:test'
import { screen, waitFor } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'

import messages from '@/messages/pt.json'
import { resetNextMocks } from '../../support/next'
import { renderWithProviders } from '../../support/render'

const confirmDeletion = mock(
  async (_token: string): Promise<{ error?: string; invalid?: boolean }> => ({}),
)

mock.module('@/app/[locale]/(public)/confirm-deletion/_actions/confirm-deletion', () => ({
  confirmDeletion,
}))

const { ConfirmDeletionCard } = await import(
  '@/app/[locale]/(public)/confirm-deletion/_components/confirm-deletion-card'
)

function renderCard(token?: string) {
  return renderWithProviders(
    <NextIntlClientProvider locale="pt" messages={messages}>
      <ConfirmDeletionCard token={token} />
    </NextIntlClientProvider>,
  )
}

describe('ConfirmDeletionCard', () => {
  beforeEach(() => {
    resetNextMocks()

    confirmDeletion.mockClear()

    confirmDeletion.mockImplementation(async () => ({}))
  })

  it('does not delete on load, only on the click', async () => {
    const { user } = renderCard('token-1')

    expect(confirmDeletion).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: /Confirmar exclusão/ }))

    await waitFor(() => expect(confirmDeletion).toHaveBeenCalledWith('token-1'))

    expect(await screen.findByText('Conta excluída')).toBeInTheDocument()

    expect(screen.getByRole('link', { name: /Ir para a página inicial/ })).toHaveAttribute(
      'href',
      '/',
    )
  })

  it('shows an invalid link without a button', async () => {
    confirmDeletion.mockImplementation(async () => ({
      error: 'Invalid or expired token',
      invalid: true,
    }))

    const { user } = renderCard('stale')

    await user.click(screen.getByRole('button', { name: /Confirmar exclusão/ }))

    expect(await screen.findByText('Link inválido ou expirado')).toBeInTheDocument()

    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('allows a retry after a connection or server failure', async () => {
    confirmDeletion.mockImplementationOnce(async () => ({ error: 'Servidor indisponível' }))

    const { user } = renderCard('token-1')

    await user.click(screen.getByRole('button', { name: /Confirmar exclusão/ }))

    expect(await screen.findByText('Não deu para confirmar agora')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Confirmar exclusão/ }))

    expect(await screen.findByText('Conta excluída')).toBeInTheDocument()

    expect(confirmDeletion).toHaveBeenCalledTimes(2)
  })

  it('shows an error without a button when the link has no token', () => {
    renderCard(undefined)

    expect(screen.getByText(/Este link está incompleto/)).toBeInTheDocument()

    expect(screen.queryByRole('button')).not.toBeInTheDocument()

    expect(confirmDeletion).not.toHaveBeenCalled()
  })
})
