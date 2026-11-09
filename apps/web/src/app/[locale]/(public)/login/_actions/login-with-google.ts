'use server'

import { AuthError } from 'next-auth'

import { signIn } from '@/lib/auth'

export async function loginWithGoogle(): Promise<{ error?: string }> {
  try {
    await signIn('google', { redirectTo: '/dashboard' })

    return {}
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: 'Não foi possível entrar com o Google agora. Tente novamente em instantes.' }
    }

    throw error
  }
}
