'use server'

import { AuthError } from 'next-auth'

import { signIn } from '@/lib/auth'

export interface LoginInput {
  email: string
  password: string
}

export async function login(input: LoginInput): Promise<{ error?: string }> {
  try {
    await signIn('credentials', { ...input, redirect: false })

    return {}
  } catch (error) {
    if (error instanceof AuthError && error.type === 'CredentialsSignin') {
      const { code } = error as AuthError & { code: string }

      if (code === 'credentials') return { error: 'E-mail ou senha inválidos.' }

      if (code === 'too_many_attempts') {
        return { error: 'Muitas tentativas de login. Aguarde e tente novamente.' }
      }
    }

    return { error: 'Não foi possível entrar agora. Tente novamente em instantes.' }
  }
}
