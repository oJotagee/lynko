'use server'

import { revalidatePath } from 'next/cache'
import { AuthError } from 'next-auth'

import { signIn } from '@/lib/auth'

export type LoginTwoFactorInput =
  | { challengeToken: string; code: string }
  | { challengeToken: string; recoveryCode: string }

const MESSAGES: Record<string, string> = {
  invalid_code: 'Código inválido. Confira e tente de novo.',
  too_many_attempts: 'Muitas tentativas. Aguarde 15 minutos e tente de novo.',
  two_factor_expired: 'O tempo para digitar o código acabou. Entre de novo.',
}

export async function loginTwoFactor(
  input: LoginTwoFactorInput,
): Promise<{ error?: string; expired?: boolean }> {
  try {
    await signIn('two-factor', { ...input, redirect: false })

    revalidatePath('/[locale]', 'layout')

    return {}
  } catch (error) {
    if (error instanceof AuthError && error.type === 'CredentialsSignin') {
      const { code } = error as AuthError & { code: string }

      return {
        error: MESSAGES[code] ?? MESSAGES.invalid_code,
        expired: code === 'two_factor_expired',
      }
    }

    return { error: 'Não foi possível entrar agora. Tente novamente em instantes.' }
  }
}
