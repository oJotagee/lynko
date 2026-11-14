import { isAxiosError } from 'axios'

import { getApiErrorMessage } from '@/lib/api-error'

const MESSAGES: Record<string, string> = {
  'Invalid password': 'Senha incorreta.',
  'Invalid code': 'Código inválido. Confira o app e tente de novo.',
  'Two-factor authentication already enabled': 'O login em duas etapas já está ativo.',
  'Two-factor authentication is not enabled': 'O login em duas etapas não está ativo.',
  'Two-factor setup not started': 'A ativação expirou. Comece de novo.',
  'Two-factor setup changed, start again': 'A ativação expirou. Comece de novo.',
  'Account has no password': 'Sua conta entra com o Google e não usa esta verificação.',
}

export function getTwoFactorError(error: unknown, fallback: string) {
  const message = isAxiosError(error) ? error.response?.data?.message : undefined

  return (typeof message === 'string' && MESSAGES[message]) || getApiErrorMessage(error, fallback)
}
