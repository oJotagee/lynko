import { afterEach, beforeEach, describe, expect, it, mock, spyOn } from 'bun:test'
import { screen, waitFor } from '@testing-library/react'
import QRCode from 'qrcode'

import { QrCodeButton } from '@/app/[locale]/(panel)/dashboard/_components/layout/qr-code-button'
import { getPublicPageUrl, getQrCodeUrl, SITE_URL } from '@/lib/site'
import { buildDashboardData } from '../../../../support/builders'
import { resetNextMocks, toast } from '../../../../support/next'
import { renderWithProviders } from '../../../../support/render'

const published = { ...buildDashboardData().profile, username: 'maria', published: true }

describe('QR code', () => {
  let clicks: { href: string; download: string }[]

  beforeEach(() => {
    resetNextMocks()

    clicks = []

    spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      clicks.push({ href: this.href, download: this.download })
    })

    spyOn(URL, 'createObjectURL').mockReturnValue('blob:svg')

    spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
  })

  afterEach(() => {
    mock.restore()
  })

  it('points the QR code to the public page with the qr source', () => {
    expect(getPublicPageUrl('maria')).toBe(`${SITE_URL}/maria`)

    expect(getQrCodeUrl('maria')).toBe(`${SITE_URL}/maria?src=qr`)
  })

  it('is disabled until the page is published', () => {
    renderWithProviders(<QrCodeButton profile={{ ...published, published: false }} />)

    expect(
      screen.getByLabelText('QR code, publique sua página para gerar o QR code'),
    ).toBeDisabled()
  })

  it('shows the QR code of the page and downloads it as PNG and SVG', async () => {
    const toDataURL = spyOn(QRCode, 'toDataURL')

    const toSvg = spyOn(QRCode, 'toString')

    const { user } = renderWithProviders(<QrCodeButton profile={published} />)

    await user.click(screen.getByLabelText('QR code da página'))

    const image = await screen.findByAltText(`QR code para ${SITE_URL}/maria`)

    expect(image.getAttribute('src')).toStartWith('data:image/png;base64,')

    expect(toDataURL.mock.calls[0]?.[0]).toBe(`${SITE_URL}/maria?src=qr`)

    expect(toSvg.mock.calls[0]?.[0]).toBe(`${SITE_URL}/maria?src=qr`)

    await user.click(screen.getByText('Baixar PNG'))

    await user.click(screen.getByText('Baixar SVG'))

    expect(clicks).toEqual([
      { href: expect.stringMatching(/^data:image\/png;base64,/), download: 'lynko-maria-qr.png' },
      { href: 'blob:svg', download: 'lynko-maria-qr.svg' },
    ])
  })

  it('copies the public page address without the qr source', async () => {
    const { user } = renderWithProviders(<QrCodeButton profile={published} />)

    await user.click(screen.getByLabelText('QR code da página'))

    await user.click(await screen.findByLabelText('Copiar endereço'))

    expect(await navigator.clipboard.readText()).toBe(`${SITE_URL}/maria`)

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('URL copiada'))
  })

  it('uses the custom domain in the QR code and in the copied address', async () => {
    const toDataURL = spyOn(QRCode, 'toDataURL')

    const { user } = renderWithProviders(
      <QrCodeButton profile={{ ...published, customDomain: 'seunome.com' }} />,
    )

    await user.click(screen.getByLabelText('QR code da página'))

    await screen.findByAltText('QR code para https://seunome.com')

    expect(toDataURL.mock.calls[0]?.[0]).toBe('https://seunome.com?src=qr')

    await user.click(screen.getByLabelText('Copiar endereço'))

    expect(await navigator.clipboard.readText()).toBe('https://seunome.com')
  })

  it('shows an error when the QR code cannot be generated', async () => {
    spyOn(QRCode, 'toString').mockImplementation((async () => {
      throw new Error('boom')
    }) as never)

    const { user } = renderWithProviders(<QrCodeButton profile={published} />)

    await user.click(screen.getByLabelText('QR code da página'))

    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível gerar o QR code')

    expect(screen.getByText('Baixar PNG').closest('button')).toBeDisabled()
  })
})
