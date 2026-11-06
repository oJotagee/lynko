import { describe, expect, it } from 'bun:test'
import { render, screen } from '@testing-library/react'

import { defaultAppearance } from '@/app/[locale]/_components/appearance-schema'
import { PageView } from '@/app/[locale]/_components/page-view/page-view'
import '../../support/next'

const profile = { name: 'Maria', username: 'maria', bio: '', image: '' }

const link = {
  id: 'link-1',
  title: 'Portfólio',
  url: 'https://example.com/portfolio',
  color: '#fff',
}

const social = { platform: 'github' as const, url: 'https://github.com/maria', isActive: true }

describe('PageView tracking hrefs', () => {
  it('uses the tracked href for links and social icons when given', () => {
    render(
      <PageView
        profile={profile}
        appearance={defaultAppearance}
        links={[{ ...link, href: 'https://api.test/r/link-1' }]}
        socialLinks={[{ ...social, href: 'https://api.test/r/social/page/github' }]}
      />,
    )

    expect(screen.getByRole('link', { name: /Portfólio/ })).toHaveAttribute(
      'href',
      'https://api.test/r/link-1',
    )

    expect(screen.getByRole('link', { name: 'GitHub' })).toHaveAttribute(
      'href',
      'https://api.test/r/social/page/github',
    )
  })

  it('points straight to the urls without href, as in the dashboard preview', () => {
    render(
      <PageView
        profile={profile}
        appearance={defaultAppearance}
        links={[link]}
        socialLinks={[social]}
      />,
    )

    expect(screen.getByRole('link', { name: /Portfólio/ })).toHaveAttribute(
      'href',
      'https://example.com/portfolio',
    )

    expect(screen.getByRole('link', { name: 'GitHub' })).toHaveAttribute(
      'href',
      'https://github.com/maria',
    )
  })
})
