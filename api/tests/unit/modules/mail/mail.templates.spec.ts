import { afterEach, beforeEach, describe, expect, it } from 'bun:test'

import { env } from '../../../../src/config/env'
import {
  accountDeletedMessage,
  confirmDeletionMessage,
  passwordChangedMessage,
  resetPasswordMessage,
  verifyEmailMessage,
} from '../../../../src/modules/mail/mail.templates'

describe('mail templates', () => {
  const original = env.WEB_URL

  beforeEach(() => {
    env.WEB_URL = 'https://lynko.test'
  })

  afterEach(() => {
    env.WEB_URL = original
  })

  it.each([
    ['verifyEmailMessage', verifyEmailMessage, '/verify-email'],
    ['resetPasswordMessage', resetPasswordMessage, '/reset-password'],
    ['confirmDeletionMessage', confirmDeletionMessage, '/confirm-deletion'],
  ])('%s links to the web page with the encoded token', (_, build, path) => {
    const message = build('Ana', 'a b&c')

    const link = `https://lynko.test${path}?token=a%20b%26c`

    expect(message.text).toContain(link)

    expect(message.html).toContain(link.replaceAll('&', '&amp;'))
  })

  it('escapes html in the user name', () => {
    const message = verifyEmailMessage('<script>alert(1)</script>', 'token')

    expect(message.html).not.toContain('<script>')

    expect(message.html).toContain('&lt;script&gt;')
  })

  it('builds the messages without links', () => {
    expect(passwordChangedMessage('Ana').subject).toBeTruthy()

    expect(accountDeletedMessage('Ana').text).toContain('Ana')

    expect(passwordChangedMessage('Ana').html).not.toContain('<a ')
  })
})
