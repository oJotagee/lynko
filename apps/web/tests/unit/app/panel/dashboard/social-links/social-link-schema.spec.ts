import { describe, expect, it } from 'bun:test'

import {
  formatWhatsappInput,
  getSocialLinkHref,
  socialLinksSchema,
} from '@/app/[locale]/_components/social-links/social-link-schema'

describe('formatWhatsappInput', () => {
  it.each([
    ['11912345678', '+55 (11) 91234-5678'],
    ['5511912345678', '+55 (11) 91234-5678'],
    ['+55 11 91234 5678', '+55 (11) 91234-5678'],
    ['1133334444', '+55 (11) 3333-4444'],
    ['+5511', '+55 (11'],
    ['+55 (11) 9', '+55 (11) 9'],
    ['+55 (11) 91234-', '+55 (11) 9123-4'],
    ['+55', '+55'],
    ['+', '+'],
    ['', ''],
    ['+1 415 555 2671', '+14155552671'],
    ['11912345678999', '+55 (11) 91234-5678'],
  ])('formats %s as %s', (input, expected) => {
    expect(formatWhatsappInput(input)).toBe(expected)
  })

  it.each(['https://wa.me/5511912345678', 'wa.me/55119', 'javascript:alert(1)'])(
    'leaves the url %s untouched',
    (url) => {
      expect(formatWhatsappInput(url)).toBe(url)
    },
  )

  it('produces a value the schema accepts and turns into wa.me', () => {
    const url = formatWhatsappInput('11912345678')

    expect(
      socialLinksSchema.safeParse([{ platform: 'whatsapp', url, isActive: true }]).success,
    ).toBe(true)

    expect(getSocialLinkHref({ platform: 'whatsapp', url, isActive: true })).toBe(
      'https://wa.me/5511912345678',
    )
  })
})

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
