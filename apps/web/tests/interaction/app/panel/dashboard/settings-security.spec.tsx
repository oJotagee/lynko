import { beforeEach, describe, expect, it, mock } from 'bun:test'
import { screen } from '@testing-library/react'

import { buildApiDashboard } from '../../../../unit/support/builders'
import { buildDashboardData } from '../../../support/builders'
import { resetNextMocks } from '../../../support/next'
import { renderWithProviders } from '../../../support/render'

mock.module('@/app/[locale]/(panel)/dashboard/_actions/change-password', () => ({
  changePassword: mock(async () => ({ data: true })),
}))

mock.module('@/app/[locale]/(panel)/dashboard/_actions/create-page', () => ({
  createPage: mock(async () => ({ data: {} })),
}))

mock.module('@/app/[locale]/(panel)/dashboard/_actions/update-page', () => ({
  updatePage: mock(async () => ({ data: {} })),
}))

const { SettingsPanel } = await import(
  '@/app/[locale]/(panel)/dashboard/settings/_components/settings-panel'
)

const baseUser = buildApiDashboard().user

describe('SettingsPanel security tab', () => {
  beforeEach(() => resetNextMocks())

  it('shows the change password form for an account with a password', async () => {
    const { user } = renderWithProviders(
      <SettingsPanel user={baseUser} data={buildDashboardData()} hasPage />,
    )

    await user.click(screen.getByRole('button', { name: 'Segurança' }))

    expect(screen.getByLabelText('Senha atual')).toBeInTheDocument()

    expect(screen.queryByText(/ainda não estão disponíveis/)).not.toBeInTheDocument()
  })

  it('explains that a Google-only account has no password and hides the form', async () => {
    const { user } = renderWithProviders(
      <SettingsPanel
        user={{ ...baseUser, hasPassword: false, hasGoogle: true }}
        data={buildDashboardData()}
        hasPage
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Segurança' }))

    expect(screen.getByText(/Sua conta entra com o Google/)).toBeInTheDocument()

    expect(screen.queryByLabelText('Senha atual')).not.toBeInTheDocument()
  })
})
