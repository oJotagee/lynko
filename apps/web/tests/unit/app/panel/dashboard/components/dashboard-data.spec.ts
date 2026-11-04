import { describe, expect, it } from 'bun:test'

import {
  appearanceToTheme,
  defaultTheme,
  moveLink,
  themeToAppearance,
  toDashboardData,
} from '@/app/[locale]/(panel)/dashboard/_components/dashboard-data'
import { buildApiDashboard, buildApiLink, buildApiPage } from '../../../../support/builders'

describe('toDashboardData', () => {
  const dashboard = buildApiDashboard({
    page: buildApiPage({ title: 'Perfil real', username: 'perfil_real', bio: 'Minha bio' }),
    links: [
      buildApiLink({ id: 'second', position: 1, isActive: false }),
      buildApiLink({ id: 'first', position: 0 }),
    ],
  })

  it('maps the page, the account e-mail and the links sorted by position', () => {
    const data = toDashboardData(dashboard)

    expect(data.profile).toEqual({
      name: 'Perfil real',
      email: 'maria@example.com',
      username: 'perfil_real',
      bio: 'Minha bio',
      image: '',
      published: false,
    })

    expect(data.links.map((link) => [link.id, link.active])).toEqual([
      ['first', true],
      ['second', false],
    ])
  })

  it('does not mutate the API links', () => {
    toDashboardData(dashboard)

    expect(dashboard.links[0]?.id).toBe('second')
  })

  it('uses the account name and the default theme when there is no page', () => {
    const data = toDashboardData(buildApiDashboard({ page: null, links: [] }))

    expect(data.profile).toMatchObject({ name: 'Maria Silva', username: '', published: false })
    expect(appearanceToTheme(data.appearance)).toEqual(defaultTheme)
  })
})

describe('themeToAppearance', () => {
  it('converts back to the same API theme', () => {
    expect(appearanceToTheme(themeToAppearance(defaultTheme))).toEqual(defaultTheme)
  })

  it('recognizes a preset by its background and falls back to custom', () => {
    expect(themeToAppearance({ ...defaultTheme, backgroundColor: '#e9ff9e' }).theme).toBe('lime')
    expect(themeToAppearance(defaultTheme).theme).toBe('custom')
  })
})

describe('moveLink', () => {
  const links = toDashboardData(
    buildApiDashboard({
      links: [buildApiLink({ id: 'a' }), buildApiLink({ id: 'b', position: 1 })],
    }),
  ).links

  it('moves the link to the target position', () => {
    expect(moveLink(links, 'b', 0).map((link) => link.id)).toEqual(['b', 'a'])
    expect(links.map((link) => link.id)).toEqual(['a', 'b'])
  })

  it.each([
    ['an unknown id', 'missing', 0],
    ['a negative target', 'a', -1],
    ['a target after the end', 'a', 2],
  ])('returns the same list for %s', (_case, id, target) => {
    expect(moveLink(links, id, target)).toBe(links)
  })
})
