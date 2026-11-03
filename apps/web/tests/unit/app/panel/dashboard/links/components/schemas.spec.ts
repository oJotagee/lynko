import { describe, expect, it } from 'bun:test'

import { linkSchema } from '@/app/[locale]/(panel)/dashboard/links/_components/schemas'

describe('linkSchema', () => {
  const validInput = { title: 'Portfólio', url: 'https://example.com' }

  it('accepts a valid link and trims the fields', () => {
    expect(linkSchema.parse({ title: ' Portfólio ', url: ' https://example.com ' })).toEqual(
      validInput,
    )
  })

  it.each(['javascript:alert(1)', 'data:text/html,test', 'ftp://example.com', 'example.com'])(
    'rejects the url %s',
    (url) => {
      const result = linkSchema.safeParse({ ...validInput, url })

      expect(result.success).toBe(false)
      expect(result.error?.issues[0]?.message).toBe('Informe uma URL com http ou https')
    },
  )

  it('rejects an empty title', () => {
    expect(linkSchema.safeParse({ ...validInput, title: '  ' }).success).toBe(false)
  })

  it('rejects a title over 80 characters', () => {
    expect(linkSchema.safeParse({ ...validInput, title: 'x'.repeat(81) }).success).toBe(false)
  })
})
