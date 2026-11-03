import { defaultTheme } from '@/app/[locale]/(panel)/dashboard/_components/dashboard-data'
import type {
  ApiDashboard,
  ApiLink,
  ApiPage,
} from '@/app/[locale]/(panel)/dashboard/_data-access/get-dashboard'

export const linkId = 'a26d7946-6249-4f68-95e6-5cb612ccf538'

export function buildApiPage(overrides: Partial<ApiPage> = {}): ApiPage {
  return {
    id: 'page-1',
    username: 'maria',
    title: 'Maria Silva',
    bio: null,
    avatarUrl: null,
    theme: defaultTheme,
    isPublished: false,
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

export function buildApiLink(overrides: Partial<ApiLink> = {}): ApiLink {
  return {
    id: linkId,
    title: 'Portfólio',
    url: 'https://example.com',
    position: 0,
    isActive: true,
    ...overrides,
  }
}

export function buildApiDashboard(overrides: Partial<ApiDashboard> = {}): ApiDashboard {
  return {
    user: { id: 'user-1', name: 'Maria Silva', email: 'maria@example.com' },
    page: buildApiPage(),
    links: [buildApiLink()],
    ...overrides,
  }
}
