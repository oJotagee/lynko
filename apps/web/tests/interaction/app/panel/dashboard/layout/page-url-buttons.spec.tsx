import { beforeEach, describe, expect, it } from 'bun:test'
import { screen } from '@testing-library/react'

import { CopyPageUrlButton } from '@/app/[locale]/(panel)/dashboard/_components/layout/copy-page-url-button'
import { PreviewPageButton } from '@/app/[locale]/(panel)/dashboard/_components/layout/preview-page-button'
import { SITE_URL } from '@/lib/site'
import { buildDashboardData } from '../../../../support/builders'
import { resetNextMocks } from '../../../../support/next'
import { renderWithProviders } from '../../../../support/render'

const published = { ...buildDashboardData().profile, username: 'maria', published: true }

const withDomain = { ...published, customDomain: 'seunome.com' }

describe('page address buttons', () => {
  beforeEach(() => {
    resetNextMocks()
  })

  it('shows and copies the Lynko address without a custom domain', async () => {
    const { user } = renderWithProviders(<CopyPageUrlButton profile={published} hasPage />)

    await user.click(screen.getByText(`${new URL(SITE_URL).host}/maria`))

    expect(await navigator.clipboard.readText()).toBe(`${SITE_URL}/maria`)
  })

  it('shows and copies the custom domain', async () => {
    const { user } = renderWithProviders(<CopyPageUrlButton profile={withDomain} hasPage />)

    await user.click(screen.getByText('seunome.com'))

    expect(await navigator.clipboard.readText()).toBe('https://seunome.com')
  })

  it('opens the page on the custom domain', () => {
    renderWithProviders(<PreviewPageButton profile={withDomain} />)

    expect(screen.getByLabelText('Ver página pública em nova aba')).toHaveAttribute(
      'href',
      'https://seunome.com',
    )
  })
})
