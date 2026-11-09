import { env } from '../../config/env'

type Content = {
  subject: string
  html: string
  text: string
}

const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => HTML_ESCAPES[char] ?? char)
}

function buildLink(path: string, token: string) {
  return `${env.WEB_URL}${path}?token=${encodeURIComponent(token)}`
}

function layout(name: string, paragraphs: string[], action?: { label: string; url: string }) {
  const body = paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join('')

  const button = action
    ? `<p><a href="${escapeHtml(action.url)}" style="display:inline-block;padding:12px 24px;background:#111;color:#fff;text-decoration:none;border-radius:8px">${escapeHtml(action.label)}</a></p><p>Ou copie este link no navegador:<br>${escapeHtml(action.url)}</p>`
    : ''

  const html = `<div style="font-family:sans-serif;max-width:480px"><p>Olá, ${escapeHtml(name)}!</p>${body}${button}</div>`

  const text = [
    `Olá, ${name}!`,
    ...paragraphs,
    ...(action ? [`${action.label}: ${action.url}`] : []),
  ].join('\n\n')

  return { html, text }
}

export function verifyEmailMessage(name: string, token: string): Content {
  const url = buildLink('/verify-email', token)

  return {
    subject: 'Confirme seu e-mail na Lynko',
    ...layout(
      name,
      ['Confirme seu e-mail para ativar todos os recursos da sua conta. O link vale por 24 horas.'],
      {
        label: 'Confirmar e-mail',
        url,
      },
    ),
  }
}

export function resetPasswordMessage(name: string, token: string): Content {
  const url = buildLink('/reset-password', token)

  return {
    subject: 'Redefina sua senha na Lynko',
    ...layout(
      name,
      [
        'Recebemos um pedido para redefinir sua senha. O link vale por 30 minutos.',
        'Se não foi você, ignore este e-mail.',
      ],
      { label: 'Redefinir senha', url },
    ),
  }
}

export function passwordChangedMessage(name: string): Content {
  return {
    subject: 'Sua senha da Lynko foi alterada',
    ...layout(name, [
      'A senha da sua conta foi alterada.',
      'Se não foi você, redefina sua senha imediatamente.',
    ]),
  }
}

export function confirmDeletionMessage(name: string, token: string): Content {
  const url = buildLink('/confirm-deletion', token)

  return {
    subject: 'Confirme a exclusão da sua conta na Lynko',
    ...layout(
      name,
      [
        'Recebemos um pedido para excluir sua conta. Esta ação é permanente. O link vale por 30 minutos.',
        'Se não foi você, ignore este e-mail.',
      ],
      { label: 'Confirmar exclusão', url },
    ),
  }
}

export function accountDeletedMessage(name: string): Content {
  return {
    subject: 'Sua conta da Lynko foi excluída',
    ...layout(name, [
      'Sua conta e todos os seus dados foram excluídos.',
      'Obrigado por ter usado a Lynko.',
    ]),
  }
}
