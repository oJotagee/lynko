import nodemailer from 'nodemailer'

import { env } from '../../config/env'
import { ServiceUnavailableError } from '../../shared/errors'

export type MailMessage = {
  to: string
  subject: string
  html: string
  text: string
}

function getTransport() {
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS || !env.MAIL_FROM || !env.WEB_URL) {
    throw new ServiceUnavailableError('Mail is not configured')
  }

  const transport = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
  })

  return { transport, from: env.MAIL_FROM }
}

export const mailService = {
  async send(message: MailMessage) {
    const { transport, from } = getTransport()

    await transport.sendMail({ from, ...message })
  },

  async sendSafely(message: MailMessage) {
    try {
      await mailService.send(message)
    } catch (error) {
      console.error(
        'Failed to send email',
        message.to,
        error instanceof Error ? error.message : 'unknown error',
      )
    }
  },
}
