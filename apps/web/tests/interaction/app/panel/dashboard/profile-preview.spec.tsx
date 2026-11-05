import { describe, expect, it } from 'bun:test'
import { render, screen } from '@testing-library/react'

import { ProfilePreview } from '@/app/[locale]/(panel)/dashboard/_components/profile/profile-preview'
import { buildDashboardData } from '../../../support/builders'

describe('ProfilePreview', () => {
  it('shows only active and safe social icons', () => {
    const data = buildDashboardData({
      socialLinks: [
        { platform: 'github', url: 'https://github.com/maria', isActive: true },
        { platform: 'x', url: 'https://x.com/maria', isActive: false },
        { platform: 'youtube', url: 'javascript:alert(1)', isActive: true },
        { platform: 'whatsapp', url: '+55 11 91234-5678', isActive: true },
      ],
    })

    render(<ProfilePreview data={data} />)

    const github = screen.getByRole('link', { name: 'GitHub' })

    expect(github).toHaveAttribute('href', 'https://github.com/maria')
    expect(github).toHaveAttribute('target', '_blank')
    expect(github).toHaveAttribute('rel', 'noopener noreferrer')

    expect(screen.getByRole('link', { name: 'WhatsApp' })).toHaveAttribute(
      'href',
      'https://wa.me/5511912345678',
    )

    expect(screen.queryByRole('link', { name: 'X' })).toBeNull()
    expect(screen.queryByRole('link', { name: 'YouTube' })).toBeNull()
  })

  it('applies the button colors and shape', () => {
    const data = buildDashboardData()

    render(
      <ProfilePreview
        data={{
          ...data,
          appearance: {
            ...data.appearance,
            buttons: {
              shape: 'pill',
              backgroundColor: '#31312e',
              textColor: '#f7f6f1',
              hoverEffect: 'lift',
            },
          },
        }}
      />,
    )

    const button = screen.getByRole('link', { name: /Portfólio/ })

    expect(button.style.color).toBe('#f7f6f1')
    expect(button.style.background).toBe('#31312e')
    expect(button.style.borderRadius).toBe('24px')
  })

  it('applies the hover effect and the hover colors', () => {
    const data = buildDashboardData()

    render(
      <ProfilePreview
        data={{
          ...data,
          appearance: {
            ...data.appearance,
            buttons: {
              shape: 'rounded',
              backgroundColor: '#111111',
              textColor: '#ffffff',
              hoverEffect: 'grow',
              hoverColor: '#ff8d6b',
            },
          },
        }}
      />,
    )

    const button = screen.getByRole('link', { name: /Portfólio/ })

    expect(button.className).toContain('hover:scale-[1.03]')
    expect(button.className).toContain('hover:bg-(--button-hover-bg)!')
    expect(button.style.getPropertyValue('--button-hover-bg')).toBe('#ff8d6b')
    expect(button.style.getPropertyValue('--button-hover-fg')).toBe('#ffffff')
  })

  it('applies the text color, font and gradient background', () => {
    const data = buildDashboardData()

    const { container } = render(
      <ProfilePreview
        data={{
          ...data,
          appearance: {
            ...data.appearance,
            background: { type: 'gradient', gradientFrom: '#000000', gradientTo: '#ffffff' },
            typography: { fontFamily: 'playfair', textColor: '#abcdef' },
          },
        }}
      />,
    )

    const root = container.querySelector<HTMLElement>('[style*="font-family"]')

    expect(root?.style.color).toBe('#abcdef')
    expect(root?.style.fontFamily).toContain('--font-playfair-display')
    expect(root?.style.backgroundImage).toContain('linear-gradient')
  })

  it('applies the social icon size and color', () => {
    const data = buildDashboardData({
      socialLinks: [{ platform: 'github', url: 'https://github.com/maria', isActive: true }],
    })

    render(
      <ProfilePreview
        data={{
          ...data,
          appearance: { ...data.appearance, socialIcons: { size: 'lg', color: '#123456' } },
        }}
      />,
    )

    const link = screen.getByRole('link', { name: 'GitHub' })

    expect(link).toHaveClass('size-12')
    expect(link.style.color).toBe('#123456')
  })

  it('uses the desktop width in desktop mode', () => {
    const { container } = render(<ProfilePreview data={buildDashboardData()} mode="desktop" />)

    expect(container.firstElementChild).toHaveClass('max-w-[640px]')
  })

  it('hides inactive links', () => {
    const data = buildDashboardData()

    render(
      <ProfilePreview
        data={{ ...data, links: data.links.map((link) => ({ ...link, active: false })) }}
      />,
    )

    expect(screen.queryByRole('link', { name: /Portfólio/ })).toBeNull()

    expect(screen.getByRole('link', { name: 'Lynko' })).toHaveAttribute('target', '_blank')
    expect(screen.getByText('Seus links aparecerão aqui.')).toBeInTheDocument()
  })
})
