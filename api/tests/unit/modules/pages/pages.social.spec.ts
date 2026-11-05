import { describe, expect, it } from 'bun:test'

import { socialLinksSchema } from '../../../../src/modules/pages/pages.social'

const link = (platform: string, url: string, isActive = true) => ({ platform, url, isActive })

describe('socialLinksSchema', () => {
  it('accepts valid links and keeps the order', () => {
    const result = socialLinksSchema.parse([
      link('github', 'https://github.com/maria'),
      link('instagram', ' https://instagram.com/maria '),
    ])

    expect(result.map((item) => item.platform)).toEqual(['github', 'instagram'])

    expect(result[1]?.url).toBe('https://instagram.com/maria')
  })

  it('rejects more than 10 links', () => {
    const platforms = [
      'instagram',
      'facebook',
      'tiktok',
      'youtube',
      'linkedin',
      'github',
      'whatsapp',
      'x',
      'spotify',
      'pinterest',
      'instagram',
    ]

    const links = platforms.map((platform) => link(platform, 'https://example.com'))

    expect(socialLinksSchema.safeParse(links).success).toBe(false)
  })

  it('rejects a repeated platform', () => {
    const result = socialLinksSchema.safeParse([
      link('github', 'https://github.com/a'),
      link('github', 'https://github.com/b'),
    ])

    expect(result.success).toBe(false)
  })

  it.each([
    'javascript:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    'ftp://example.com',
    'not a url',
  ])('rejects the url %s', (url) => {
    expect(socialLinksSchema.safeParse([link('github', url)]).success).toBe(false)
  })

  it('rejects an unknown platform', () => {
    expect(socialLinksSchema.safeParse([link('myspace', 'https://example.com')]).success).toBe(
      false,
    )
  })

  it('turns a whatsapp phone number into a wa.me link', () => {
    const [result] = socialLinksSchema.parse([link('whatsapp', '+55 (11) 91234-5678')])

    expect(result?.url).toBe('https://wa.me/5511912345678')
  })

  it('keeps a whatsapp http url and rejects other schemes', () => {
    const [result] = socialLinksSchema.parse([link('whatsapp', 'https://wa.me/5511912345678')])

    expect(result?.url).toBe('https://wa.me/5511912345678')

    expect(socialLinksSchema.safeParse([link('whatsapp', 'javascript:alert(1)')]).success).toBe(
      false,
    )
  })
})
