import { isAxiosError } from 'axios'

import { getApiErrorMessage } from '@/lib/api-error'

const MESSAGES: Record<string, string> = {
  'Invalid domain': 'Digite um domínio válido, como seunome.com ou links.seunome.com.',
  'Pro plan required': 'O domínio próprio é um recurso do Pro.',
  'Page not found': 'Crie sua página antes de ligar um domínio.',
  'Domain already connected': 'Sua conta já tem um domínio. Remova o atual para ligar outro.',
  'Domain already in use': 'Este domínio já está ligado a outra conta do Lynko.',
  'Domain not found': 'Nenhum domínio ligado à sua conta.',
  'Custom domains unavailable':
    'O domínio próprio está indisponível agora. Tente de novo em instantes.',
}

export function getDomainError(error: unknown, fallback: string) {
  const message = isAxiosError(error) ? error.response?.data?.message : undefined

  return (typeof message === 'string' && MESSAGES[message]) || getApiErrorMessage(error, fallback)
}
