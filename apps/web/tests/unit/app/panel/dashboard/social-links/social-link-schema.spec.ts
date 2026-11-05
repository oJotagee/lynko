import { describe, expect, it } from 'bun:test'

import {
  getSocialLinkHref,
  socialLinksSchema,
} from '@/app/[locale]/_components/social-links/social-link-schema'

const link = (platform: string, url: string, isActive = true) => ({ platform, url, isActive })

describe('socialLinksSchema', () => {
  it('rejects javascript and data urls', () => {
    expect(socialLinksSchema.safeParse([link('github', 'javascript:alert(1)')]).success).toBe(false)
    expect(socialLinksSchema.safeParse([link('github', 'data:text/html,x')]).success).toBe(false)
  })

  it('rejects a repeated platform', () => {
    const result = socialLinksSchema.safeParse([
      link('github', 'https://github.com/a'),
      link('github', 'https://github.com/b'),
    ])

    expect(result.success).toBe(false)
  })

  it('accepts a whatsapp phone number', () => {
    expect(socialLinksSchema.safeParse([link('whatsapp', '+55 11 91234-5678')]).success).toBe(true)
  })
})

describe('getSocialLinkHref', () => {
  it('turns a whatsapp number into a wa.me link', () => {
    expect(getSocialLinkHref(link('whatsapp', '+55 (11) 91234-5678') as never)).toBe(
      'https://wa.me/5511912345678',
    )
  })

  it('returns null for an unsafe url', () => {
    expect(getSocialLinkHref(link('github', 'javascript:alert(1)') as never)).toBeNull()
  })

  it('returns the trimmed url otherwise', () => {
    expect(getSocialLinkHref(link('github', ' https://github.com/maria ') as never)).toBe(
      'https://github.com/maria',
    )
  })
})
