'use server'

import { api } from '@/lib/api'
import { getApiAuthorization } from '@/lib/get-api-authorization'
import { getTwoFactorError } from '@/lib/two-factor-error'

export async function enableTwoFactor(
  code: string,
): Promise<{ data?: { recoveryCodes: string[] }; error?: string }> {
  try {
    const { data } = await api.post<{ recoveryCodes: string[] }>(
      '/users/me/two-factor/enable',
      { code },
      { headers: await getApiAuthorization() },
    )

    return { data }
  } catch (error) {
    return { error: getTwoFactorError(error, 'Não foi possível ativar. Tente novamente.') }
  }
}
