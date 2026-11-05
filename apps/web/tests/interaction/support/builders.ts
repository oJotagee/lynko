import { defaultAppearance } from '@/app/[locale]/_components/appearance-schema'
import type {
  DashboardData,
  DashboardLink,
} from '@/app/[locale]/(panel)/dashboard/_components/dashboard-data'

export function buildLink(overrides: Partial<DashboardLink> = {}): DashboardLink {
  return {
    id: 'a26d7946-6249-4f68-95e6-5cb612ccf538',
    title: 'Portfólio',
    url: 'https://example.com',
    active: true,
    color: '#9b8cff',
    ...overrides,
  }
}

export function buildDashboardData(overrides: Partial<DashboardData> = {}): DashboardData {
  return {
    profile: {
      name: 'Maria Silva',
      email: 'maria@example.com',
      username: 'maria',
      bio: '',
      image: '',
      avatarMediaId: null,
      published: false,
    },
    appearance: defaultAppearance,
    backgroundImageUrl: null,
    socialLinks: [],
    links: [buildLink()],
    ...overrides,
  }
}
