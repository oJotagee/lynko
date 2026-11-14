import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'
import { ImageResponse } from 'next/og'
import { renderToStaticMarkup } from 'react-dom/server'

import { defaultAppearance } from '@/app/[locale]/_components/appearance-schema'
import { getInitials } from '@/app/[locale]/_components/initials'
import type { ApiPublicPage } from '@/app/[locale]/(public)/[username]/_data-access/get-public-page'
import { getPublicPageUrl, SITE_URL } from '@/lib/site'

const CDN = 'https://cdn.lynko.test'

function buildPage(overrides: Partial<ApiPublicPage> = {}): ApiPublicPage {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    username: 'maria',
    title: 'Maria Silva',
    bio: 'Designer',
    avatarUrl: null,
    backgroundImageUrl: null,
    appearance: defaultAppearance,
    socialLinks: [],
    links: [],
    ...overrides,
  }
}

const getPublicPage = mock(async (_username: string): Promise<ApiPublicPage | null> => buildPage())

mock.module('@/app/[locale]/(public)/[username]/_data-access/get-public-page', () => ({
  getPublicPage,
}))

const { isMediaUrl, ShareImage } = await import(
  '@/app/[locale]/(public)/[username]/_components/share-image'
)

const { generateMetadata } = await import('@/app/[locale]/(public)/[username]/page')

const params = (username: string) => ({
  params: Promise.resolve({ locale: 'pt', username }),
})

describe('share preview helpers', () => {
  it('builds the public page url', () => {
    expect(getPublicPageUrl('maria')).toBe(`${SITE_URL}/maria`)
  })

  it.each([
    [`${CDN}/media/page/avatar.png`, true],
    [`${CDN}.evil.dev/media/a.png`, false],
    ['https://evil.dev/media/a.png', false],
    ['http://169.254.169.254/latest/meta-data', false],
    [null, false],
  ])('isMediaUrl(%p) is %p', (url, expected) => {
    expect(isMediaUrl(url, CDN)).toBe(expected)
  })

  it('accepts nothing when the CDN is not configured', () => {
    expect(isMediaUrl(`${CDN}/media/a.png`, undefined)).toBe(false)
  })

  it('takes the first and last initials', () => {
    expect(getInitials('  Maria da Silva ')).toBe('MS')

    expect(getInitials('Ana')).toBe('A')
  })
})

describe('ShareImage', () => {
  const cdn = process.env.MEDIA_CDN_URL

  beforeEach(() => {
    process.env.MEDIA_CDN_URL = CDN
  })

  afterEach(() => {
    process.env.MEDIA_CDN_URL = cdn
  })

  it('uses the avatar from the CDN', () => {
    const html = renderToStaticMarkup(
      <ShareImage page={buildPage({ avatarUrl: `${CDN}/media/p/avatar.png` })} />,
    )

    expect(html).toContain(`${CDN}/media/p/avatar.png`)

    expect(html).toContain('Maria Silva')

    expect(html).toContain('@maria')
  })

  it('shows the initials instead of an avatar from another host', () => {
    const html = renderToStaticMarkup(
      <ShareImage page={buildPage({ avatarUrl: 'https://evil.dev/me.png' })} />,
    )

    expect(html).not.toContain('evil.dev')

    expect(html).toContain('>MS<')
  })

  it('falls back to the background color when the image is not on the CDN', () => {
    const html = renderToStaticMarkup(
      <ShareImage
        page={buildPage({
          appearance: {
            ...defaultAppearance,
            background: { type: 'image', color: '#123456', imageMediaId: crypto.randomUUID() },
          },
          backgroundImageUrl: 'https://evil.dev/bg.png',
        })}
      />,
    )

    expect(html).not.toContain('evil.dev')

    expect(html).toContain('background-color:#123456')
  })
})

describe('ShareImage rendered by ImageResponse', () => {
  it.each([
    ['solid', { type: 'solid' as const, color: '#171716' }],
    ['gradient', { type: 'gradient' as const, gradientFrom: '#9b8cff', gradientTo: '#ffd7ca' }],
    ['image', { type: 'image' as const, color: '#334455', imageMediaId: crypto.randomUUID() }],
  ])('renders a %s background as a PNG', async (_label, background) => {
    const response = new ImageResponse(
      <ShareImage page={buildPage({ appearance: { ...defaultAppearance, background } })} />,
      { width: 1200, height: 630 },
    )

    const png = new Uint8Array(await response.arrayBuffer())

    expect(response.headers.get('content-type')).toBe('image/png')

    expect([...png.slice(1, 4)].map((byte) => String.fromCharCode(byte)).join('')).toBe('PNG')
  })
})

describe('generateMetadata', () => {
  beforeEach(() => {
    getPublicPage.mockReset()
  })

  it('fills open graph and twitter with the page data', async () => {
    getPublicPage.mockResolvedValue(buildPage())

    const metadata = await generateMetadata(params('maria') as never)

    expect(metadata).toMatchObject({
      title: 'Maria Silva (@maria)',
      description: 'Designer',
      openGraph: {
        title: 'Maria Silva (@maria)',
        url: `${SITE_URL}/maria`,
        siteName: 'Lynko',
      },
      twitter: { card: 'summary_large_image' },
    })
  })

  it('uses a default description without a bio', async () => {
    getPublicPage.mockResolvedValue(buildPage({ bio: null }))

    const metadata = await generateMetadata(params('maria') as never)

    expect(metadata.description).toBe('Todos os links de Maria Silva no Lynko.')
  })

  it('returns no metadata for a page that does not exist', async () => {
    getPublicPage.mockResolvedValue(null)

    expect(await generateMetadata(params('ninguem') as never)).toEqual({})
  })
})
