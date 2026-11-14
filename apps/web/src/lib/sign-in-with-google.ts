import type { Account, User } from 'next-auth'

import { api } from './api'
import { getClientUserAgentHeader } from './client-user-agent'
import { readApiTokens } from './read-api-tokens'
import { type UserSession, userSessionSchema } from './user-session'

export async function signInWithGoogle(user: User, account: Account | null | undefined) {
  if (account?.provider !== 'google' || !account.id_token) return false

  try {
    const response = await api.post<{ accessToken: string }>(
      '/auth/google',
      { idToken: account.id_token },
      { headers: await getClientUserAgentHeader() },
    )

    const tokens = readApiTokens(response)

    const { data } = await api.get<UserSession>('/users/me', {
      headers: { Authorization: `Bearer ${tokens.accessToken}` },
    })

    Object.assign(user, userSessionSchema.parse(data), tokens)

    return true
  } catch {
    return false
  }
}
