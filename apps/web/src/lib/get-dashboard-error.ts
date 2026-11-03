import { isAxiosError } from 'axios'
import { getApiErrorMessage } from '@/lib/api-error'

const messages: Record<string, string> = {
  'Username already taken': 'Este nome de usuário já está em uso.',
  'User already has a page': 'Sua conta já possui uma página. Atualize a página existente.',
  'Page not found': 'Sua página não foi encontrada. Recarregue o dashboard.',
  'Link not found': 'Este link não foi encontrado. Recarregue a lista.',
  'A page can have at most 100 links': 'Sua página pode ter até 100 links.',
}

export function getDashboardError(error: unknown, fallback: string): string {
  if (!isAxiosError(error)) return fallback

  if (!error.response || [401, 429].includes(error.response.status))
    return getApiErrorMessage(error, fallback)

  const message = error.response.data?.message

  return typeof message === 'string' ? (messages[message] ?? fallback) : fallback
}
