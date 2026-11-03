import { beforeEach, describe, expect, it, mock } from 'bun:test'
import { screen, waitFor } from '@testing-library/react'

import type { DashboardData } from '@/app/[locale]/(panel)/dashboard/_components/dashboard-data'
import { buildDashboardData } from '../../../support/builders'
import { resetNextMocks, toast } from '../../../support/next'
import { renderWithProviders } from '../../../support/render'

type ActionResult = { data?: unknown; error?: string }

const createPage = mock(async (_input: DashboardData): Promise<ActionResult> => ({ data: {} }))
const updatePage = mock(async (_input: DashboardData): Promise<ActionResult> => ({ data: {} }))

mock.module('@/app/[locale]/(panel)/dashboard/_actions/create-page', () => ({ createPage }))
mock.module('@/app/[locale]/(panel)/dashboard/_actions/update-page', () => ({ updatePage }))

const { ProfileForm } = await import(
  '@/app/[locale]/(panel)/dashboard/_components/profile/profile-form'
)

describe('ProfileForm', () => {
  beforeEach(() => {
    resetNextMocks()
    createPage.mockClear()
    updatePage.mockClear()
  })

  it('creates the page when the user has none', async () => {
    const data = buildDashboardData({
      profile: { ...buildDashboardData().profile, username: '' },
    })
    const { user } = renderWithProviders(<ProfileForm data={data} hasPage={false} />)

    expect(screen.getByRole('switch')).toHaveAttribute('data-disabled')

    await user.type(screen.getByLabelText('Nome de usuário'), 'Maria_Silva')
    await user.click(screen.getByRole('button', { name: 'Criar minha página' }))

    await waitFor(() =>
      expect(createPage).toHaveBeenCalledWith(
        expect.objectContaining({
          profile: expect.objectContaining({ username: 'maria_silva' }),
        }),
        expect.anything(),
      ),
    )
    expect(updatePage).not.toHaveBeenCalled()
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith('Página criada. Agora adicione seus links.'),
    )
  })

  it('shows the reserved username error and does not submit', async () => {
    const { user } = renderWithProviders(<ProfileForm data={buildDashboardData()} hasPage />)

    const username = screen.getByLabelText('Nome de usuário')
    await user.clear(username)
    await user.type(username, 'admin')
    await user.click(screen.getByRole('button', { name: 'Salvar perfil' }))

    expect(await screen.findByText('Este nome de usuário é reservado')).toBeInTheDocument()
    expect(updatePage).not.toHaveBeenCalled()
  })

  it('publishes the page on save', async () => {
    const { user } = renderWithProviders(<ProfileForm data={buildDashboardData()} hasPage />)

    await user.click(screen.getByRole('switch'))
    await user.click(screen.getByRole('button', { name: 'Salvar perfil' }))

    await waitFor(() =>
      expect(updatePage).toHaveBeenCalledWith(
        expect.objectContaining({ profile: expect.objectContaining({ published: true }) }),
        expect.anything(),
      ),
    )
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Página atualizada'))
  })
})
