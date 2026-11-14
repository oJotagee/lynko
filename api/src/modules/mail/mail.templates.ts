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

export function twoFactorEnabledMessage(name: string): Content {
  return {
    subject: 'Login em duas etapas ativado na Lynko',
    ...layout(name, [
      'O login em duas etapas foi ativado na sua conta. A partir de agora, além da senha, pedimos um código do seu app autenticador.',
      'Se não foi você, redefina sua senha imediatamente.',
    ]),
  }
}

export function twoFactorDisabledMessage(name: string): Content {
  return {
    subject: 'Login em duas etapas desativado na Lynko',
    ...layout(name, [
      'O login em duas etapas foi desativado na sua conta. Agora basta a senha para entrar.',
      'Se não foi você, redefina sua senha imediatamente.',
    ]),
  }
}

export function recoveryCodesRegeneratedMessage(name: string): Content {
  return {
    subject: 'Novos códigos de recuperação na Lynko',
    ...layout(name, [
      'Novos códigos de recuperação foram gerados para a sua conta. Os códigos antigos não funcionam mais.',
      'Se não foi você, redefina sua senha imediatamente.',
    ]),
  }
}

const dateFormat = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'long',
  timeZone: 'America/Sao_Paulo',
})

export function proActivatedMessage(name: string, periodEnd: Date | null): Content {
  return {
    subject: 'Seu Pro da Lynko está ativo',
    ...layout(name, [
      'Obrigado por assinar o Pro da Lynko. Os recursos Pro já estão liberados na sua conta.',
      ...(periodEnd ? [`A próxima cobrança será em ${dateFormat.format(periodEnd)}.`] : []),
    ]),
  }
}

export function customDomainLiveMessage(name: string, hostname: string): Content {
  return {
    subject: `Seu domínio ${hostname} está no ar`,
    ...layout(
      name,
      [
        `O domínio ${hostname} está conectado à sua página da Lynko, com HTTPS.`,
        'O QR code e o link copiado no painel já usam o novo endereço.',
      ],
      { label: 'Abrir minha página', url: `https://${hostname}` },
    ),
  }
}

export function proCancelledMessage(name: string, accessUntil: Date | null): Content {
  return {
    subject: 'Sua assinatura Pro da Lynko foi cancelada',
    ...layout(name, [
      'Sua assinatura Pro foi cancelada e não haverá novas cobranças.',
      accessUntil
        ? `Você continua com o Pro até ${dateFormat.format(accessUntil)}. Depois disso, a conta volta ao plano grátis e nenhum dado é apagado.`
        : 'A conta volta ao plano grátis e nenhum dado é apagado.',
    ]),
  }
}
