import { beforeEach, describe, expect, it, mock } from 'bun:test'
import { render, screen } from '@testing-library/react'

import { defaultAppearance } from '@/app/[locale]/_components/appearance-schema'
import { PageView } from '@/app/[locale]/_components/page-view/page-view'
import { PeriodFilter } from '@/app/[locale]/(panel)/dashboard/analytics/_components/period-filter'
import { BrandingSection } from '@/app/[locale]/(panel)/dashboard/appearance/_components/sections/branding'
import { resetNextMocks, router } from '../../../support/next'
import { renderWithProviders } from '../../../support/render'

describe('Pro gates', () => {
  beforeEach(() => {
    resetNextMocks()
  })

  describe('PeriodFilter', () => {
    it('sends a free account to the plans instead of selecting 90 days', async () => {
      const onChange = mock((_period: string) => undefined)

      const { user } = renderWithProviders(
        <PeriodFilter value="7d" onChange={onChange} isPro={false} />,
      )

      await user.click(screen.getByRole('button', { name: '90 dias, exclusivo do Pro' }))

      expect(router.push).toHaveBeenCalledWith('/dashboard/plans')
      expect(onChange).not.toHaveBeenCalled()

      await user.click(screen.getByRole('button', { name: '30 dias' }))

      expect(onChange).toHaveBeenCalledWith('30d')
    })

    it('lets Pro select 90 days', async () => {
      const onChange = mock((_period: string) => undefined)

      const { user } = renderWithProviders(<PeriodFilter value="7d" onChange={onChange} isPro />)

      await user.click(screen.getByRole('button', { name: '90 dias' }))

      expect(onChange).toHaveBeenCalledWith('90d')
      expect(router.push).not.toHaveBeenCalled()
    })
  })

  describe('BrandingSection', () => {
    it('locks the switch on a free account and links to the plans', () => {
      renderWithProviders(<BrandingSection value isPro={false} onChange={() => {}} />)

      expect(screen.getByRole('switch', { name: /Feito com Lynko/ })).toHaveAttribute(
        'aria-disabled',
        'true',
      )
      expect(screen.getByText('Ver planos').closest('a')).toHaveAttribute(
        'href',
        '/dashboard/plans',
      )
    })

    it('lets Pro hide the branding', async () => {
      const onChange = mock((_value: boolean) => undefined)

      const { user } = renderWithProviders(<BrandingSection value isPro onChange={onChange} />)

      await user.click(screen.getByRole('switch', { name: /Feito com Lynko/ }))

      expect(onChange).toHaveBeenCalledWith(false)
      expect(screen.queryByText('Ver planos')).toBeNull()
    })

    it('lets a former Pro account show the branding again', async () => {
      const onChange = mock((_value: boolean) => undefined)

      const { user } = renderWithProviders(
        <BrandingSection value={false} isPro={false} onChange={onChange} />,
      )

      await user.click(screen.getByRole('switch', { name: /Feito com Lynko/ }))

      expect(onChange).toHaveBeenCalledWith(true)
    })
  })

  describe('PageView', () => {
    const props = {
      profile: { name: 'Maria', username: 'maria', bio: '', image: '' },
      appearance: defaultAppearance,
      socialLinks: [],
      links: [],
    }

    it('shows "Feito com Lynko" by default and hides it when asked', () => {
      const { rerender } = render(<PageView {...props} fixedFooter />)

      expect(screen.getByText('Lynko')).toBeInTheDocument()

      rerender(<PageView {...props} fixedFooter showBranding={false} />)

      expect(screen.queryByText('Lynko')).toBeNull()
      expect(screen.queryByText(/Feito com/)).toBeNull()
    })
  })
})
