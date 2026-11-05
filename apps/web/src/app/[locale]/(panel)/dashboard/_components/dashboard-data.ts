import {
  defaultAppearance,
  type PageAppearance,
} from '@/app/[locale]/_components/appearance-schema'
import type { SocialLinkData } from '@/app/[locale]/_components/social-links/social-link-schema'
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
  avatarMediaId: string | null
  published: boolean
}

export interface DashboardData {
  profile: DashboardProfile
  appearance: PageAppearance
  backgroundImageUrl: string | null
  socialLinks: SocialLinkData[]
  links: DashboardLink[]
}

const linkAccents = ['#9b8cff', '#ff8d6b', '#b7f34a'] as const

export const defaultTheme: PageTheme = {
  backgroundColor: '#ffffff',
  textColor: '#111111',
  buttonColor: '#111111',
  buttonTextColor: '#ffffff',
  buttonStyle: 'filled',
  buttonRadius: 'medium',
}

export function toDashboardData({ user, page, links }: ApiDashboard): DashboardData {
  return {
    profile: {
      name: page?.title ?? user.name,
      email: user.email,
      username: page?.username ?? '',
      bio: page?.bio ?? '',
      image: page?.avatarUrl ?? '',
      avatarMediaId: page?.avatarMediaId ?? null,
      published: page?.isPublished ?? false,
    },
    appearance: page?.appearance ?? defaultAppearance,
    backgroundImageUrl: page?.backgroundImageUrl ?? null,
    socialLinks: page?.socialLinks ?? [],
    links: [...links]
      .sort((a, b) => a.position - b.position)
      .map((link, index) => ({
        id: link.id,
        title: link.title,
        url: link.url,
        active: link.isActive,
        color: linkAccents[index % linkAccents.length],
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
