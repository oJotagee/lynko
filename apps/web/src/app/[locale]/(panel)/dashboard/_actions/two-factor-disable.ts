'use server'

import { api } from '@/lib/api'
import { getApiAuthorization } from '@/lib/get-api-authorization'
import { getTwoFactorError } from '@/lib/two-factor-error'

export type DisableTwoFactorInput =
  | { password: string; code: string }
  | { password: string; recoveryCode: string }

export async function disableTwoFactor(
  input: DisableTwoFactorInput,
): Promise<{ data?: true; error?: string }> {
  try {
    await api.post('/users/me/two-factor/disable', input, {
      headers: await getApiAuthorization(),
    })

    return { data: true }
  } catch (error) {
    return { error: getTwoFactorError(error, 'Não foi possível desativar. Tente novamente.') }
  }
}
