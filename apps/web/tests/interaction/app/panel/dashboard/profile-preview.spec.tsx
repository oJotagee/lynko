import { describe, expect, it } from 'bun:test'
import { render, screen } from '@testing-library/react'

import { ProfilePreview } from '@/app/[locale]/(panel)/dashboard/_components/profile/profile-preview'
import { buildDashboardData } from '../../../support/builders'

describe('ProfilePreview', () => {
  const colors = { button: '#31312e', buttonText: '#f7f6f1' }

  it('uses the button text color on outline buttons', () => {
    const data = buildDashboardData()

    render(
      <ProfilePreview
        data={{ ...data, appearance: { ...data.appearance, ...colors, buttonStyle: 'outline' } }}
      />,
    )

    const button = screen.getByRole('link', { name: /Portfólio/ })

    expect(button.style.color).toBe('#f7f6f1')
    expect(button.style.borderColor).toBe('#31312e')
    expect(button.style.background).toBe('transparent')
  })

  it('fills filled buttons with the button color', () => {
    const data = buildDashboardData()

    render(
      <ProfilePreview
        data={{ ...data, appearance: { ...data.appearance, ...colors, buttonStyle: 'filled' } }}
      />,
    )

    const button = screen.getByRole('link', { name: /Portfólio/ })

    expect(button.style.color).toBe('#f7f6f1')
    expect(button.style.background).toBe('#31312e')
  })

  it('hides inactive links', () => {
    const data = buildDashboardData()

    render(
      <ProfilePreview
        data={{ ...data, links: data.links.map((link) => ({ ...link, active: false })) }}
      />,
    )

    expect(screen.queryByRole('link')).toBeNull()
    expect(screen.getByText('Seus links aparecerão aqui.')).toBeInTheDocument()
  })
})
