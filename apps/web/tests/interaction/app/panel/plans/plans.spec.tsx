import { afterEach, beforeEach, describe, expect, it, mock, spyOn } from 'bun:test'
import { screen, waitFor } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import type { ApiSubscription } from '@/app/[locale]/(panel)/dashboard/_data-access/get-subscription'
import type { ApiPlan } from '@/app/[locale]/(panel)/dashboard/plans/_data-access/get-plans'
import messages from '@/messages/pt.json'
import { resetNextMocks, toast } from '../../../support/next'
import { renderWithProviders } from '../../../support/render'

const free: ApiSubscription = {
  plan: 'free',
  status: null,
  cycle: null,
  currentPeriodEnd: null,
  accessUntil: null,
}

const pro: ApiSubscription = {
  plan: 'pro',
  status: 'active',
  cycle: 'annually',
  currentPeriodEnd: '2027-11-14T12:00:00.000Z',
  accessUntil: '2027-11-17T12:00:00.000Z',
}

const getPlans = mock(
  async (): Promise<ApiPlan[]> => [
    { cycle: 'monthly', amount: 1990, currency: 'BRL' },
    { cycle: 'annually', amount: 19990, currency: 'BRL' },
  ],
)

const getSubscription = mock(async (): Promise<ApiSubscription> => free)

const cancelSubscription = mock(
  async (): Promise<{ data?: { accessUntil: string | null }; error?: string }> => ({
    data: { accessUntil: '2027-11-14T12:00:00.000Z' },
  }),
)

const startCheckout = mock(
  async (_cycle: string): Promise<{ data?: { url: string }; error?: string }> => ({
    data: { url: 'https://app.abacatepay.com/pay/bill_1' },
  }),
)

const root = '@/app/[locale]/(panel)/dashboard'

mock.module(`${root}/plans/_data-access/get-plans`, () => ({ getPlans }))

mock.module(`${root}/_data-access/get-subscription`, () => ({ getSubscription }))

mock.module(`${root}/_actions/cancel-subscription`, () => ({ cancelSubscription }))

mock.module(`${root}/plans/_actions/start-checkout`, () => ({ startCheckout }))

const { Plans } = await import(`${root}/plans/_components/plans`)

function renderPlans() {
  return renderWithProviders(
    <NextIntlClientProvider locale="pt" messages={messages}>
      <Plans />
    </NextIntlClientProvider>,
  )
}

const { CheckoutStatus } = await import(`${root}/plans/_components/checkout-status`)

const { PlanSection } = await import(`${root}/settings/_components/plan-section`)

describe('Plans', () => {
  let assign: ReturnType<typeof spyOn>

  beforeEach(() => {
    resetNextMocks()

    for (const fn of [getPlans, getSubscription, cancelSubscription, startCheckout]) fn.mockClear()

    getSubscription.mockImplementation(async () => free)

    assign = spyOn(window.location, 'assign').mockImplementation(() => {})
  })

  afterEach(() => {
    assign.mockRestore()
  })

  it('shows the annual price per month with the real saving and switches to monthly', async () => {
    const { user } = renderPlans()

    expect(await screen.findByText('R$ 16,66')).toBeInTheDocument()
    expect(screen.getByText('R$ 199,90 cobrados por ano')).toBeInTheDocument()
    expect(screen.getByText('Economize 16%')).toBeInTheDocument()
    expect(await screen.findByText('Seu plano atual')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Mensal' }))

    expect(screen.getByText('R$ 19,90')).toBeInTheDocument()
    expect(screen.getByText('por mês')).toBeInTheDocument()
  })

  it('opens the AbacatePay checkout for the chosen cycle', async () => {
    const { user } = renderPlans()

    await user.click(screen.getByRole('button', { name: 'Mensal' }))

    await user.click(await screen.findByRole('button', { name: 'Assinar o Pro' }))

    await waitFor(() => expect(startCheckout.mock.calls[0]?.[0]).toBe('monthly'))

    await waitFor(() =>
      expect(assign).toHaveBeenCalledWith('https://app.abacatepay.com/pay/bill_1'),
    )
  })

  it('shows the error from the checkout', async () => {
    startCheckout.mockImplementationOnce(async () => ({ error: 'Você já é Pro.' }))

    const { user } = renderPlans()

    await user.click(await screen.findByRole('button', { name: 'Assinar o Pro' }))

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Você já é Pro.'))

    expect(assign).not.toHaveBeenCalled()
  })

  it('shows "Seu plano" on Pro instead of the subscribe button', async () => {
    getSubscription.mockImplementation(async () => pro)

    renderPlans()

    expect(await screen.findByText('Gerenciar assinatura')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Assinar o Pro' })).toBeNull()
  })

  it('shows an error and retries when prices fail', async () => {
    getPlans.mockImplementationOnce(async () => {
      throw new Error('falhou')
    })

    const { user } = renderPlans()

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível carregar os preços.',
    )

    await user.click(screen.getByText('Tentar novamente'))

    expect(await screen.findByText('R$ 16,66')).toBeInTheDocument()
  })
})

describe('CheckoutStatus', () => {
  beforeEach(() => {
    getSubscription.mockClear()
  })

  it('confirms the Pro once the plan changes', async () => {
    getSubscription.mockImplementationOnce(async () => free)

    getSubscription.mockImplementation(async () => pro)

    renderWithProviders(<CheckoutStatus />)

    expect(screen.getByText('Confirmando seu pagamento…')).toBeInTheDocument()

    expect(
      await screen.findByText('Seu Pro está ativo', undefined, { timeout: 5000 }),
    ).toBeInTheDocument()
  })
})

describe('PlanSection', () => {
  beforeEach(() => {
    resetNextMocks()

    getSubscription.mockClear()

    cancelSubscription.mockClear()
  })

  it('shows the free plan with a link to the plans', async () => {
    getSubscription.mockImplementation(async () => free)

    renderWithProviders(<PlanSection />)

    expect(await screen.findByText('Você está no plano grátis.')).toBeInTheDocument()
    expect(screen.getByText('Ver o Pro').closest('a')).toHaveAttribute('href', '/dashboard/plans')
  })

  it('cancels the subscription after the confirmation', async () => {
    getSubscription.mockImplementation(async () => pro)

    const { user } = renderWithProviders(<PlanSection />)

    expect(
      await screen.findByText('Pro anual. A próxima cobrança é em 14/11/2027.'),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Cancelar assinatura' }))

    expect(cancelSubscription).not.toHaveBeenCalled()

    await user.click(await screen.findByRole('button', { name: 'Cancelar assinatura' }))

    await waitFor(() => expect(cancelSubscription).toHaveBeenCalledTimes(1))

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Assinatura cancelada'))
  })

  it('shows when a cancelled Pro ends', async () => {
    getSubscription.mockImplementation(async () => ({ ...pro, status: 'cancelled' }))

    renderWithProviders(<PlanSection />)

    expect(
      await screen.findByText('Assinatura cancelada. Seu Pro termina em 17/11/2027.'),
    ).toBeInTheDocument()
  })
})
