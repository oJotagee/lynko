'use server'

import { api } from '@/lib/api'
import { getApiAuthorization } from '@/lib/get-api-authorization'
import { getTwoFactorError } from '@/lib/two-factor-error'

export interface TwoFactorSetup {
  secret: string
  otpauthUrl: string
}

export async function startTwoFactorSetup(
  password: string,
): Promise<{ data?: TwoFactorSetup; error?: string }> {
  try {
    const { data } = await api.post<TwoFactorSetup>(
      '/users/me/two-factor/setup',
      { password },
      { headers: await getApiAuthorization() },
    )

    return { data }
  } catch (error) {
    return {
      error: getTwoFactorError(error, 'Não foi possível iniciar a ativação. Tente novamente.'),
    }
  }
}
