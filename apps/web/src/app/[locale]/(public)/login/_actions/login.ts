'use server'

import type { LoginSchemaData } from '../_components/schemas'

export async function login(_input: LoginSchemaData): Promise<{ error?: string }> {
  return { error: 'O acesso ainda não está disponível. Tente novamente mais tarde.' }
}
