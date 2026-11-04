import { beforeEach, describe, expect, it, mock } from 'bun:test'
import { fireEvent, screen, waitFor } from '@testing-library/react'

import type { DashboardData } from '@/app/[locale]/(panel)/dashboard/_components/dashboard-data'
import { buildDashboardData } from '../../../../support/builders'
import { resetNextMocks, toast } from '../../../../support/next'
import { renderWithProviders } from '../../../../support/render'

type ActionResult = { data?: unknown; error?: string }

const updatePage = mock(async (_input: DashboardData): Promise<ActionResult> => ({ data: {} }))

mock.module('@/app/[locale]/(panel)/dashboard/_actions/update-page', () => ({ updatePage }))

const { AppearanceEditor } = await import(
  '@/app/[locale]/(panel)/dashboard/appearance/_components/appearance-editor'
)

describe('AppearanceEditor', () => {
  beforeEach(() => {
    resetNextMocks()

    updatePage.mockClear()
    updatePage.mockImplementation(async () => ({ data: {} }))
  })

  it('saves the chosen theme', async () => {
    const { user } = renderWithProviders(<AppearanceEditor data={buildDashboardData()} hasPage />)

    await user.click(screen.getByRole('button', { name: 'Mellow' }))

    expect(screen.getByRole('button', { name: 'Mellow' })).toHaveAttribute('aria-pressed', 'true')

    await user.click(screen.getByRole('button', { name: 'Salvar aparência' }))

    await waitFor(() =>
      expect(updatePage).toHaveBeenCalledWith(
        expect.objectContaining({
          appearance: expect.objectContaining({ theme: 'lime', background: '#e9ff9e' }),
        }),
        expect.anything(),
      ),
    )

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Aparência salva'))
  })

  it('does not edit the profile and saves it unchanged', async () => {
    const data = buildDashboardData()

    const { user } = renderWithProviders(<AppearanceEditor data={data} hasPage />)

    expect(screen.queryByText('Seu perfil')).toBeNull()
    expect(screen.queryByLabelText('Nome de exibição')).toBeNull()

    await user.click(screen.getByRole('button', { name: 'Salvar aparência' }))

    await waitFor(() =>
      expect(updatePage).toHaveBeenCalledWith(
        expect.objectContaining({ profile: data.profile }),
        expect.anything(),
      ),
    )
  })

  it('shows the error and keeps the draft when saving fails', async () => {
    updatePage.mockImplementation(async () => ({ error: 'Não foi possível salvar sua página.' }))

    const { user } = renderWithProviders(<AppearanceEditor data={buildDashboardData()} hasPage />)

    await user.click(screen.getByRole('button', { name: 'Peachy' }))
    await user.click(screen.getByRole('button', { name: 'Salvar aparência' }))

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Não foi possível salvar sua página.'),
    )

    expect(screen.getByRole('button', { name: 'Peachy' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('changes a color without looping and marks the theme as custom', async () => {
    const { user } = renderWithProviders(<AppearanceEditor data={buildDashboardData()} hasPage />)

    for (const value of ['#111111', '#222222', '#333333']) {
      fireEvent.input(screen.getByLabelText('Fundo'), { target: { value } })
    }

    expect(screen.getByText('#333333')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Salvar aparência' }))

    await waitFor(() =>
      expect(updatePage).toHaveBeenCalledWith(
        expect.objectContaining({
          appearance: expect.objectContaining({ background: '#333333', theme: 'custom' }),
        }),
        expect.anything(),
      ),
    )
  })

  it('disables saving until the page exists', () => {
    renderWithProviders(<AppearanceEditor data={buildDashboardData()} hasPage={false} />)

    expect(screen.getByRole('button', { name: 'Salvar aparência' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Restaurar padrão' })).toBeDisabled()
  })
})
