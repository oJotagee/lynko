import { beforeEach, describe, expect, it, mock } from 'bun:test'
import { screen, waitFor, within } from '@testing-library/react'

import type { ApiSession } from '@/app/[locale]/(panel)/dashboard/_data-access/get-sessions'
import { resetNextMocks, toast } from '../../../support/next'
import { renderWithProviders } from '../../../support/render'

const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString()

const current: ApiSession = {
  id: 'current',
  browser: 'Chrome',
  os: 'Windows',
  createdAt: '2026-11-01T12:00:00.000Z',
  lastActiveAt: minutesAgo(0),
  current: true,
}

const phone: ApiSession = {
  id: 'phone',
  browser: 'Safari',
  os: 'iOS',
  createdAt: '2026-11-10T12:00:00.000Z',
  lastActiveAt: minutesAgo(180),
  current: false,
}

const unknown: ApiSession = {
  id: 'unknown',
  browser: null,
  os: null,
  createdAt: '2026-10-20T12:00:00.000Z',
  lastActiveAt: minutesAgo(60 * 24 * 3),
  current: false,
}

const getSessions = mock(async (): Promise<ApiSession[]> => [current, phone, unknown])

const revokeSession = mock(
  async (_id: string): Promise<{ data?: true; error?: string }> => ({
    data: true,
  }),
)

const revokeOtherSessions = mock(
  async (): Promise<{ data?: { revoked: number }; error?: string }> => ({ data: { revoked: 2 } }),
)

mock.module('@/app/[locale]/(panel)/dashboard/_data-access/get-sessions', () => ({ getSessions }))

mock.module('@/app/[locale]/(panel)/dashboard/_actions/revoke-session', () => ({ revokeSession }))

mock.module('@/app/[locale]/(panel)/dashboard/_actions/revoke-other-sessions', () => ({
  revokeOtherSessions,
}))

const { SessionsSection } = await import(
  '@/app/[locale]/(panel)/dashboard/settings/_components/sessions-section'
)

describe('SessionsSection', () => {
  beforeEach(() => {
    resetNextMocks()

    for (const fn of [getSessions, revokeSession, revokeOtherSessions]) fn.mockClear()

    getSessions.mockImplementation(async () => [current, phone, unknown])

    revokeSession.mockImplementation(async () => ({ data: true }))
  })

  it('lists the devices with the current one first and without a disconnect button', async () => {
    renderWithProviders(<SessionsSection />)

    const items = await screen.findAllByRole('listitem')

    expect(items).toHaveLength(3)

    expect(items[0]).toHaveTextContent('Chrome no Windows')
    expect(items[0]).toHaveTextContent('Este dispositivo')
    expect(items[0]).toHaveTextContent('ativo agora')
    expect(within(items[0] as HTMLElement).queryByText('Desconectar')).toBeNull()

    expect(items[1]).toHaveTextContent('Safari no iOS')
    expect(items[1]).toHaveTextContent('ativo há 3 horas')

    expect(items[2]).toHaveTextContent('Dispositivo desconhecido')
    expect(items[2]).toHaveTextContent('Entrou em 20/10/2026')
  })

  it('disconnects a device after the confirmation', async () => {
    const { user } = renderWithProviders(<SessionsSection />)

    const items = await screen.findAllByRole('listitem')

    await user.click(within(items[1] as HTMLElement).getByLabelText('Desconectar Safari no iOS'))

    expect(await screen.findByText('Desconectar Safari no iOS?')).toBeInTheDocument()

    expect(revokeSession).not.toHaveBeenCalled()

    const dialog = await screen.findByRole('alertdialog')

    await user.click(within(dialog).getByText('Desconectar'))

    await waitFor(() => expect(revokeSession).toHaveBeenCalledWith('phone'))

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Dispositivo desconectado'))

    expect(getSessions.mock.calls.length).toBeGreaterThanOrEqual(2)
  })

  it('shows the error from the action', async () => {
    revokeSession.mockImplementation(async () => ({
      error: 'Este dispositivo já estava desconectado.',
    }))

    const { user } = renderWithProviders(<SessionsSection />)

    const items = await screen.findAllByRole('listitem')

    await user.click(within(items[1] as HTMLElement).getByLabelText('Desconectar Safari no iOS'))

    await user.click(within(await screen.findByRole('alertdialog')).getByText('Desconectar'))

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Este dispositivo já estava desconectado.'),
    )
  })

  it('disconnects every other device after the confirmation', async () => {
    const { user } = renderWithProviders(<SessionsSection />)

    await user.click(await screen.findByText('Sair de todos os outros dispositivos'))

    await user.click(within(await screen.findByRole('alertdialog')).getByText('Sair dos outros'))

    await waitFor(() => expect(revokeOtherSessions).toHaveBeenCalledTimes(1))

    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith('Os outros dispositivos foram desconectados'),
    )
  })

  it('says when only this device is connected', async () => {
    getSessions.mockImplementation(async () => [current])

    renderWithProviders(<SessionsSection />)

    expect(await screen.findByText('Você só está conectado neste dispositivo.')).toBeInTheDocument()

    expect(screen.queryByText('Sair de todos os outros dispositivos')).toBeNull()
  })

  it('shows the error and retries', async () => {
    getSessions.mockImplementationOnce(async () => {
      throw new Error('falhou')
    })

    const { user } = renderWithProviders(<SessionsSection />)

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível carregar os dispositivos.',
    )

    await user.click(screen.getByText('Tentar novamente'))

    expect(await screen.findByText('Chrome no Windows')).toBeInTheDocument()
  })
})
