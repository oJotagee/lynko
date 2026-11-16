import { beforeEach, describe, expect, it, mock } from 'bun:test'
import { screen, waitFor, within } from '@testing-library/react'

import type { ApiDomain } from '@/app/[locale]/(panel)/dashboard/_data-access/get-domain'
import { resetNextMocks, toast } from '../../../support/next'
import { renderWithProviders } from '../../../support/render'

const pending: ApiDomain = {
  hostname: 'seunome.com',
  kind: 'apex',
  status: 'pending_owner',
  lastError: null,
  checkedAt: null,
  records: [
    { type: 'TXT', name: '_lynko', value: 'lynko-verify=abc', purpose: 'ownership' },
    { type: 'A', name: '@', value: '198.51.100.7', purpose: 'routing' },
  ],
}

const live: ApiDomain = { ...pending, status: 'active', records: [] }

const getDomain = mock(async (): Promise<ApiDomain | null> => null)

const connectDomain = mock(
  async (_input: { hostname: string }): Promise<{ data?: ApiDomain; error?: string }> => ({
    data: pending,
  }),
)

const checkDomain = mock(
  async (): Promise<{ data?: ApiDomain; error?: string }> => ({ data: live }),
)

const removeDomain = mock(async (): Promise<{ error?: string }> => ({}))

mock.module('@/app/[locale]/(panel)/dashboard/_data-access/get-domain', () => ({ getDomain }))

mock.module('@/app/[locale]/(panel)/dashboard/_actions/connect-domain', () => ({ connectDomain }))

mock.module('@/app/[locale]/(panel)/dashboard/_actions/check-domain', () => ({ checkDomain }))

mock.module('@/app/[locale]/(panel)/dashboard/_actions/remove-domain', () => ({ removeDomain }))

const { DomainSection } = await import(
  '@/app/[locale]/(panel)/dashboard/settings/_components/domain-section'
)

describe('DomainSection', () => {
  beforeEach(() => {
    resetNextMocks()

    for (const fn of [getDomain, connectDomain, checkDomain, removeDomain]) fn.mockClear()

    getDomain.mockImplementation(async () => null)

    connectDomain.mockImplementation(async () => ({ data: pending }))

    checkDomain.mockImplementation(async () => ({ data: live }))

    removeDomain.mockImplementation(async () => ({}))
  })

  it('locks the feature on the free plan without a domain', async () => {
    renderWithProviders(<DomainSection isPro={false} hasPage />)

    expect(await screen.findByText('Domínio próprio é um recurso do Pro.')).toBeInTheDocument()

    expect(screen.getByRole('link', { name: 'Ver o Pro' })).toHaveAttribute(
      'href',
      '/dashboard/plans',
    )

    expect(screen.queryByLabelText('Seu domínio')).not.toBeInTheDocument()
  })

  it('shows the saved domain as paused after Pro ends and still lets it be removed', async () => {
    getDomain.mockImplementation(async () => live)

    const { user } = renderWithProviders(<DomainSection isPro={false} hasPage />)

    expect(await screen.findByText('Pausado')).toBeInTheDocument()

    expect(screen.getByText(/não abre mais sua página/)).toBeInTheDocument()

    expect(screen.queryByRole('button', { name: 'Verificar agora' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Remover domínio' }))

    const dialog = await screen.findByRole('alertdialog')

    await user.click(within(dialog).getByRole('button', { name: 'Remover domínio' }))

    await waitFor(() => expect(removeDomain).toHaveBeenCalledTimes(1))

    expect(await screen.findByText('Domínio próprio é um recurso do Pro.')).toBeInTheDocument()
  })

  it('connects a domain and shows the records to create', async () => {
    const { user } = renderWithProviders(<DomainSection isPro hasPage />)

    await user.type(await screen.findByLabelText('Seu domínio'), 'SeuNome.com')

    await user.click(screen.getByRole('button', { name: 'Conectar domínio' }))

    await waitFor(() => expect(connectDomain).toHaveBeenCalledWith({ hostname: 'SeuNome.com' }))

    expect(await screen.findByText('Confirmando a posse')).toBeInTheDocument()

    const table = screen.getByRole('table')

    expect(within(table).getByText('lynko-verify=abc')).toBeInTheDocument()

    expect(within(table).getByText('198.51.100.7')).toBeInTheDocument()
  })

  it('shows the error when the domain is in use', async () => {
    connectDomain.mockImplementation(async () => ({
      error: 'Este domínio já está ligado a outra conta do Lynko.',
    }))

    const { user } = renderWithProviders(<DomainSection isPro hasPage />)

    await user.type(await screen.findByLabelText('Seu domínio'), 'seunome.com')

    await user.click(screen.getByRole('button', { name: 'Conectar domínio' }))

    expect(
      await screen.findByText('Este domínio já está ligado a outra conta do Lynko.'),
    ).toBeInTheDocument()
  })

  it('validates the address before calling the server', async () => {
    const { user } = renderWithProviders(<DomainSection isPro hasPage />)

    await user.type(await screen.findByLabelText('Seu domínio'), 'não é domínio')

    await user.click(screen.getByRole('button', { name: 'Conectar domínio' }))

    expect(await screen.findByText('Digite um domínio como seunome.com')).toBeInTheDocument()

    expect(connectDomain).not.toHaveBeenCalled()
  })

  it('copies a record value and explains the missing TXT', async () => {
    getDomain.mockImplementation(async () => ({ ...pending, lastError: 'txt_missing' }))

    const { user } = renderWithProviders(<DomainSection isPro hasPage />)

    await user.click(await screen.findByLabelText('Copiar valor do registro TXT'))

    expect(await navigator.clipboard.readText()).toBe('lynko-verify=abc')

    expect(screen.getByText(/Ainda não encontramos o registro TXT/)).toBeInTheDocument()
  })

  it('checks now and shows the domain live', async () => {
    getDomain.mockImplementation(async () => pending)

    const { user } = renderWithProviders(<DomainSection isPro hasPage />)

    await user.click(await screen.findByRole('button', { name: 'Verificar agora' }))

    expect(await screen.findByText('No ar')).toBeInTheDocument()

    expect(screen.getByRole('link', { name: 'Abrir página' })).toHaveAttribute(
      'href',
      'https://seunome.com',
    )

    expect(screen.queryByRole('table')).not.toBeInTheDocument()

    expect(toast.success).toHaveBeenCalledWith('Seu domínio está no ar')
  })

  it('removes the domain after confirming', async () => {
    getDomain.mockImplementation(async () => live)

    const { user } = renderWithProviders(<DomainSection isPro hasPage />)

    await user.click(await screen.findByRole('button', { name: 'Remover domínio' }))

    const dialog = await screen.findByRole('alertdialog')

    expect(within(dialog).getByText('Remover seunome.com?')).toBeInTheDocument()

    await user.click(within(dialog).getByRole('button', { name: 'Remover domínio' }))

    await waitFor(() => expect(removeDomain).toHaveBeenCalledTimes(1))

    expect(await screen.findByLabelText('Seu domínio')).toBeInTheDocument()
  })

  it('offers a retry when the domain cannot be loaded', async () => {
    getDomain.mockImplementation(async () => {
      throw new Error('boom')
    })

    const { user } = renderWithProviders(<DomainSection isPro hasPage />)

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível carregar seu domínio.',
    )

    getDomain.mockImplementation(async () => null)

    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }))

    expect(await screen.findByLabelText('Seu domínio')).toBeInTheDocument()
  })
})
