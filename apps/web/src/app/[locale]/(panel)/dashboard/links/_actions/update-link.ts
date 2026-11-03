'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { getApiAuthorization } from '@/lib/get-api-authorization'
import type { ApiLink } from '../../_data-access/get-dashboard'
import { getDashboardError } from '@/lib/get-dashboard-error'
import { linkSchema } from '../_components/link-schema'
import { api } from '@/lib/api'

export async function updateLink(
  id: string,
  input: { title?: string; url?: string; isActive?: boolean },
): Promise<{ data?: ApiLink; error?: string }> {
  try {
    const linkId = z.uuid().parse(id)

    const values = linkSchema.extend({ isActive: z.boolean() }).partial().parse(input)

    const { data } = await api.patch<ApiLink>(`/links/${linkId}`, values, {
      headers: await getApiAuthorization(),
    })

    revalidatePath('/[locale]/dashboard', 'layout')

    return { data }
  } catch (error) {
    return { error: getDashboardError(error, 'Não foi possível atualizar o link') }
  }
}
