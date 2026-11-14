import { afterEach, beforeEach, describe, expect, it, mock, spyOn } from 'bun:test'
import { screen, waitFor, within } from '@testing-library/react'

import type { TwoFactorStatus } from '@/app/[locale]/(panel)/dashboard/_data-access/get-two-factor'
import { resetNextMocks, toast } from '../../../support/next'
import { renderWithProviders } from '../../../support/render'

const codes = Array.from({ length: 10 }, (_, index) => `abcd${index}-efgh${index}`)

const getTwoFactor = mock(
  async (): Promise<TwoFactorStatus> => ({ enabled: false, recoveryCodesLeft: 0 }),
)

const startTwoFactorSetup = mock(async (_password: string) => ({
  data: {
    secret: 'JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP',
    otpauthUrl: 'otpauth://totp/Lynko:maria%40example.com?secret=JBSWY3DPEHPK3PXP&issuer=Lynko',
  },
  error: undefined as string | undefined,
}))

const enableTwoFactor = mock(
  async (_code: string): Promise<{ data?: { recoveryCodes: string[] }; error?: string }> => ({
    data: { recoveryCodes: codes },
  }),
)

const disableTwoFactor = mock(
  async (_input: object): Promise<{ data?: true; error?: string }> => ({ data: true }),
)

const regenerateRecoveryCodes = mock(
  async (_input: object): Promise<{ data?: { recoveryCodes: string[] }; error?: string }> => ({
    data: { recoveryCodes: codes.map((code) => code.toUpperCase()) },
  }),
)

const root = '@/app/[locale]/(panel)/dashboard'

mock.module(`${root}/_data-access/get-two-factor`, () => ({ getTwoFactor }))

mock.module(`${root}/_actions/two-factor-setup`, () => ({ startTwoFactorSetup }))

mock.module(`${root}/_actions/two-factor-enable`, () => ({ enableTwoFactor }))

mock.module(`${root}/_actions/two-factor-disable`, () => ({ disableTwoFactor }))

mock.module(`${root}/_actions/regenerate-recovery-codes`, () => ({ regenerateRecoveryCodes }))

const { TwoFactorSection } = await import(`${root}/settings/_components/two-factor-section`)

const CODE_LABEL = 'Código de 6 dígitos do app autenticador'

describe('TwoFactorSection', () => {
  let downloads: string[]

  beforeEach(() => {
    resetNextMocks()

    for (const fn of [
      getTwoFactor,
      startTwoFactorSetup,
      enableTwoFactor,
      disableTwoFactor,
      regenerateRecoveryCodes,
    ]) {
      fn.mockClear()
    }

    getTwoFactor.mockImplementation(async () => ({ enabled: false, recoveryCodesLeft: 0 }))

    enableTwoFactor.mockImplementation(async () => ({ data: { recoveryCodes: codes } }))

    downloads = []

    spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      downloads.push(this.download)
    })

    spyOn(URL, 'createObjectURL').mockReturnValue('blob:codes')

    spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
  })

  afterEach(() => {
    mock.restore()
  })

  it('only explains it for a Google account', () => {
    renderWithProviders(<TwoFactorSection hasPassword={false} />)

    expect(
      screen.getByText(/verificação em duas etapas é feita pela sua Conta/),
    ).toBeInTheDocument()

    expect(screen.queryByText('Ativar login em duas etapas')).toBeNull()

    expect(getTwoFactor).not.toHaveBeenCalled()
  })

  it('enables it from the password to the recovery codes', async () => {
    enableTwoFactor.mockImplementation(async () => {
      getTwoFactor.mockImplementation(async () => ({ enabled: true, recoveryCodesLeft: 10 }))

      return { data: { recoveryCodes: codes } }
    })

    const { user } = renderWithProviders(<TwoFactorSection hasPassword />)

    await user.click(await screen.findByText('Ativar login em duas etapas'))

    await user.type(await screen.findByLabelText('Sua senha'), 'right-pass')

    await user.click(screen.getByText('Continuar'))

    expect(startTwoFactorSetup).toHaveBeenCalledWith('right-pass')

    expect(await screen.findByText('JBSW Y3DP EHPK 3PXP JBSW Y3DP EHPK 3PXP')).toBeInTheDocument()

    expect(
      await screen.findByAltText('QR code para cadastrar a Lynko no app autenticador'),
    ).toHaveAttribute('src', expect.stringMatching(/^data:image\/png;base64,/))

    await user.type(screen.getByLabelText(CODE_LABEL), '123456')

    await user.click(screen.getByText('Ativar'))

    await waitFor(() => expect(enableTwoFactor).toHaveBeenCalledWith('123456'))

    const list = await screen.findByRole('list', { name: 'Códigos de recuperação' })

    expect(within(list).getAllByRole('listitem')).toHaveLength(10)

    expect(toast.success).toHaveBeenCalledWith('Login em duas etapas ativado')

    expect(await screen.findByText('Restam 10 códigos de recuperação')).toBeInTheDocument()

    expect(screen.getByRole('list', { name: 'Códigos de recuperação' })).toBeInTheDocument()

    const finish = screen.getByText('Concluir').closest('button')

    expect(finish).toBeDisabled()

    await user.click(screen.getByText('Baixar .txt'))

    expect(downloads).toEqual(['lynko-codigos-recuperacao.txt'])

    await user.click(
      screen.getByRole('checkbox', { name: 'Guardei os códigos em um lugar seguro' }),
    )

    expect(finish).toBeEnabled()

    await user.click(finish as HTMLElement)

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())

    expect(screen.queryByText('Ativar login em duas etapas')).toBeNull()
  })

  it('shows the error for a wrong code and keeps the step', async () => {
    enableTwoFactor.mockImplementation(async () => ({
      error: 'Código inválido. Confira o app e tente de novo.',
    }))

    const { user } = renderWithProviders(<TwoFactorSection hasPassword />)

    await user.click(await screen.findByText('Ativar login em duas etapas'))

    await user.type(await screen.findByLabelText('Sua senha'), 'right-pass')

    await user.click(screen.getByText('Continuar'))

    await user.type(await screen.findByLabelText(CODE_LABEL), '000000')

    await user.click(screen.getByText('Ativar'))

    expect(
      await screen.findByText('Código inválido. Confira o app e tente de novo.'),
    ).toBeInTheDocument()

    expect(screen.queryByRole('list', { name: 'Códigos de recuperação' })).toBeNull()
  })

  it('shows how many recovery codes are left when it is enabled', async () => {
    getTwoFactor.mockImplementation(async () => ({ enabled: true, recoveryCodesLeft: 7 }))

    renderWithProviders(<TwoFactorSection hasPassword />)

    expect(await screen.findByText('Restam 7 códigos de recuperação')).toBeInTheDocument()

    expect(screen.getByText('Ativo')).toBeInTheDocument()
  })

  it('disables it with the password and a recovery code', async () => {
    getTwoFactor.mockImplementation(async () => ({ enabled: true, recoveryCodesLeft: 10 }))

    const { user } = renderWithProviders(<TwoFactorSection hasPassword />)

    await user.click(await screen.findByText('Desativar'))

    const dialog = await screen.findByRole('dialog')

    await user.type(within(dialog).getByLabelText('Sua senha'), 'right-pass')

    await user.click(within(dialog).getByText('Usar um código de recuperação'))

    await user.type(within(dialog).getByLabelText('Código de recuperação'), 'abcde-fghij')

    await user.click(within(dialog).getByRole('button', { name: 'Desativar' }))

    await waitFor(() =>
      expect(disableTwoFactor).toHaveBeenCalledWith({
        password: 'right-pass',
        recoveryCode: 'abcde-fghij',
      }),
    )

    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith('Login em duas etapas desativado'),
    )
  })

  it('generates new recovery codes with the password and an app code', async () => {
    getTwoFactor.mockImplementation(async () => ({ enabled: true, recoveryCodesLeft: 2 }))

    const { user } = renderWithProviders(<TwoFactorSection hasPassword />)

    await user.click(await screen.findByText('Gerar novos códigos'))

    const dialog = await screen.findByRole('dialog')

    await user.type(within(dialog).getByLabelText('Sua senha'), 'right-pass')

    await user.type(within(dialog).getByLabelText(CODE_LABEL), '654321')

    await user.click(within(dialog).getByRole('button', { name: 'Gerar novos códigos' }))

    await waitFor(() =>
      expect(regenerateRecoveryCodes).toHaveBeenCalledWith({
        password: 'right-pass',
        code: '654321',
      }),
    )

    expect(await screen.findByText('ABCD0-EFGH0')).toBeInTheDocument()
  })
})
