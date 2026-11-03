'use server'

import { revalidatePath } from 'next/cache'

import { signOut } from '@/lib/auth'

export async function logout(): Promise<{ error?: string }> {
  try {
    await signOut({ redirect: false })

    revalidatePath('/[locale]', 'layout')

    return {}
  } catch {
    return { error: 'Não foi possível sair da conta. Tente novamente.' }
  }
}
