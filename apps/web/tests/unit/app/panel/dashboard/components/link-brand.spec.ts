import { describe, expect, it } from 'bun:test'

import { getLinkBrand } from '@/app/[locale]/(panel)/dashboard/_components/link-brand'

describe('getLinkBrand', () => {
  it.each([
    ['https://www.youtube.com/@lynko', 'YouTube'],
    ['https://youtu.be/dQw4w9WgXcQ', 'YouTube'],
    ['https://m.youtube.com/watch?v=1', 'YouTube'],
    ['https://github.com/lynko', 'GitHub'],
    ['https://www.linkedin.com/in/lynko', 'LinkedIn'],
    ['https://br.linkedin.com/in/lynko', 'LinkedIn'],
    ['https://lnkd.in/abc', 'LinkedIn'],
    ['https://twitter.com/lynko', 'X'],
    ['https://x.com/lynko', 'X'],
    ['https://wa.me/5511999999999', 'WhatsApp'],
    ['https://open.spotify.com/artist/1', 'Spotify'],
    ['https://lynko.substack.com', 'Substack'],
    ['https://WWW.INSTAGRAM.COM/lynko', 'Instagram'],
  ])('recognizes %s as %s', (url, name) => {
    expect(getLinkBrand(url)?.name).toBe(name)
  })

  it('returns the brand color', () => {
    expect(getLinkBrand('https://youtube.com')?.color).toBe('#FF0000')
  })

  it.each([
    ['an unknown site', 'https://meusite.com.br'],
    ['a look-alike domain', 'https://notgithub.com/lynko'],
    ['a brand in the path only', 'https://example.com/youtube.com'],
    ['an invalid url', 'not a url'],
  ])('returns null for %s', (_case, url) => {
    expect(getLinkBrand(url)).toBeNull()
  })
})
