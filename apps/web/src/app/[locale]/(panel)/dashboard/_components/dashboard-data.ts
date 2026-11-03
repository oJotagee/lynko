import type { ApiDashboard, PageTheme } from '../_data-access/get-dashboard'

export interface DashboardLink {
  id: string
  title: string
  url: string
  active: boolean
  color: string
}

export interface DashboardProfile {
  name: string
  email: string
  username: string
  bio: string
  image: string
  published: boolean
}

export interface DashboardAppearance {
  theme: string
  background: string
  foreground: string
  button: string
  accent: string
  buttonText: string
  buttonStyle: PageTheme['buttonStyle']
  radius: PageTheme['buttonRadius']
}

export interface DashboardData {
  profile: DashboardProfile
  appearance: DashboardAppearance
  links: DashboardLink[]
}

export const themes = [
  {
    id: 'lime',
    name: 'Mellow',
    background: '#e9ff9e',
    foreground: '#171716',
    button: '#ffffff',
    accent: '#9b8cff',
    buttonText: '#171716',
  },
  {
    id: 'violet',
    name: 'Daydream',
    background: '#ded8ff',
    foreground: '#171716',
    button: '#ffffff',
    accent: '#9b8cff',
    buttonText: '#171716',
  },
  {
    id: 'peach',
    name: 'Peachy',
    background: '#ffd7ca',
    foreground: '#171716',
    button: '#ffffff',
    accent: '#ff8d6b',
    buttonText: '#171716',
  },
  {
    id: 'ink',
    name: 'After dark',
    background: '#171716',
    foreground: '#f7f6f1',
    button: '#31312e',
    accent: '#b7f34a',
    buttonText: '#f7f6f1',
  },
] as const

export const defaultTheme: PageTheme = {
  backgroundColor: '#ffffff',
  textColor: '#111111',
  buttonColor: '#111111',
  buttonTextColor: '#ffffff',
  buttonStyle: 'filled',
  buttonRadius: 'medium',
}

export function appearanceToTheme(appearance: DashboardAppearance): PageTheme {
  return {
    backgroundColor: appearance.background,
    textColor: appearance.foreground,
    buttonColor: appearance.button,
    buttonTextColor: appearance.buttonText,
    buttonStyle: appearance.buttonStyle,
    buttonRadius: appearance.radius,
  }
}

export function themeToAppearance(theme: PageTheme): DashboardAppearance {
  return {
    theme: themes.find((item) => item.background === theme.backgroundColor)?.id ?? 'custom',
    background: theme.backgroundColor,
    foreground: theme.textColor,
    button: theme.buttonColor,
    buttonText: theme.buttonTextColor,
    buttonStyle: theme.buttonStyle,
    radius: theme.buttonRadius,
    accent: '#9b8cff',
  }
}

export function toDashboardData({ user, page, links }: ApiDashboard): DashboardData {
  return {
    profile: {
      name: page?.title ?? user.name,
      email: user.email,
      username: page?.username ?? '',
      bio: page?.bio ?? '',
      image: page?.avatarUrl ?? '',
      published: page?.isPublished ?? false,
    },
    appearance: themeToAppearance(page?.theme ?? defaultTheme),
    links: [...links]
      .sort((a, b) => a.position - b.position)
      .map((link, index) => ({
        id: link.id,
        title: link.title,
        url: link.url,
        active: link.isActive,
        color: themes[index % 3].accent,
      })),
  }
}

export function moveLink(links: DashboardLink[], id: string, target: number): DashboardLink[] {
  const from = links.findIndex((link) => link.id === id)

  if (from < 0 || target < 0 || target >= links.length) return links

  const next = [...links]

  const [link] = next.splice(from, 1)

  next.splice(target, 0, link)

  return next
}
