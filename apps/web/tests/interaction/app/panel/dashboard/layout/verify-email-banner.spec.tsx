import { beforeEach, describe, expect, it, mock } from 'bun:test'
import { screen, waitFor } from '@testing-library/react'

import { buildApiDashboard } from '../../../../../unit/support/builders'
import { resetNextMocks, toast } from '../../../../support/next'
import { renderWithProviders } from '../../../../support/render'

type ResendResult = { data?: { retryAfter: number }; error?: string }

const resendVerification = mock(async (): Promise<ResendResult> => ({ data: { retryAfter: 1 } }))

const getDashboard = mock(async () => buildApiDashboard())

mock.module('@/app/[locale]/(panel)/dashboard/_actions/resend-verification', () => ({
  resendVerification,
}))

mock.module('@/app/[locale]/(panel)/dashboard/_data-access/get-dashboard', () => ({
  getDashboard,
}))

const { VerifyEmailBanner } = await import(
  '@/app/[locale]/(panel)/dashboard/_components/layout/verify-email-banner'
)

const { VerifyEmailBannerGate } = await import(
  '@/app/[locale]/(panel)/dashboard/_components/layout/verify-email-banner-gate'
)

const user = { ...buildApiDashboard().user, emailVerified: false }

describe('VerifyEmailBannerGate', () => {
  it('renders nothing when the e-mail is already verified', async () => {
    getDashboard.mockResolvedValueOnce(buildApiDashboard())

    expect(await VerifyEmailBannerGate()).toBeNull()
  })

  it('shows the banner only when the e-mail is not verified', async () => {
    getDashboard.mockResolvedValueOnce(buildApiDashboard({ user }))

    renderWithProviders((await VerifyEmailBannerGate()) as React.ReactElement)

    expect(screen.getByRole('status')).toHaveTextContent('maria@example.com')
  })

  it('renders nothing when the dashboard cannot be loaded', async () => {
    getDashboard.mockRejectedValueOnce(new Error('offline'))

    expect(await VerifyEmailBannerGate()).toBeNull()
  })
})

describe('VerifyEmailBanner', () => {
  beforeEach(() => {
    resetNextMocks()

    resendVerification.mockClear()

    resendVerification.mockImplementation(async () => ({ data: { retryAfter: 1 } }))
  })

  it('resends the e-mail and counts down before allowing another resend', async () => {
    const { user: person } = renderWithProviders(<VerifyEmailBanner email={user.email} />)

    await person.click(screen.getByRole('button', { name: 'Reenviar e-mail' }))

    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith('Enviamos um novo link para o seu e-mail.'),
    )

    expect(resendVerification).toHaveBeenCalledTimes(1)

    const waiting = screen.getByRole('button', { name: /Reenviar em \d+s/ })

    expect(waiting).toBeDisabled()

    await waitFor(
      () => expect(screen.getByRole('button', { name: 'Reenviar e-mail' })).toBeEnabled(),
      { timeout: 3000 },
    )
  })

  it('shows the API error and keeps the button available', async () => {
    resendVerification.mockImplementation(async () => ({
      error: 'Muitas tentativas em pouco tempo. Aguarde um instante e tente novamente.',
    }))

    const { user: person } = renderWithProviders(<VerifyEmailBanner email={user.email} />)

    await person.click(screen.getByRole('button', { name: 'Reenviar e-mail' }))

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        'Muitas tentativas em pouco tempo. Aguarde um instante e tente novamente.',
      ),
    )

    expect(toast.success).not.toHaveBeenCalled()

    expect(screen.getByRole('button', { name: 'Reenviar e-mail' })).toBeEnabled()
  })
})
