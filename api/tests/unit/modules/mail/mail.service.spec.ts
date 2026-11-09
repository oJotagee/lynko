import { afterEach, beforeEach, describe, expect, it, spyOn } from 'bun:test'

import { env } from '../../../../src/config/env'
import { mailService } from '../../../../src/modules/mail/mail.service'
import { ServiceUnavailableError } from '../../../../src/shared/errors'

const message = {
  to: 'ana@example.com',
  subject: 'Assunto',
  html: '<p>corpo secreto</p>',
  text: 'corpo secreto',
}

const keys = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS', 'MAIL_FROM', 'WEB_URL'] as const

describe('mailService', () => {
  const original = Object.fromEntries(keys.map((key) => [key, env[key]]))

  beforeEach(() => {
    for (const key of keys) env[key] = undefined
  })

  afterEach(() => {
    Object.assign(env, original)

    spyOn(console, 'error').mockRestore()

    spyOn(mailService, 'send').mockRestore()
  })

  it('send throws 503 when SMTP is not configured', async () => {
    const error = await mailService.send(message).catch((caught) => caught)

    expect(error).toBeInstanceOf(ServiceUnavailableError)

    expect(error.statusCode).toBe(503)
  })

  it('send throws 503 when WEB_URL is missing even with SMTP configured', async () => {
    env.SMTP_HOST = 'smtp.example.com'

    env.SMTP_USER = 'user'

    env.SMTP_PASS = 'pass'

    env.MAIL_FROM = 'Lynko <no-reply@example.com>'

    const error = await mailService.send(message).catch((caught) => caught)

    expect(error).toBeInstanceOf(ServiceUnavailableError)

    expect(error.statusCode).toBe(503)
  })

  it('sendSafely does not throw when send fails and never logs the body', async () => {
    spyOn(mailService, 'send').mockRejectedValue(new Error('smtp down'))

    const log = spyOn(console, 'error').mockImplementation(() => {})

    await expect(mailService.sendSafely(message)).resolves.toBeUndefined()

    expect(log).toHaveBeenCalledTimes(1)

    expect(log.mock.calls[0]).toContain('smtp down')

    expect(JSON.stringify(log.mock.calls)).not.toContain('corpo secreto')
  })
})
