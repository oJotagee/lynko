'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { api } from '@/lib/api'
import { getApiAuthorization } from '@/lib/get-api-authorization'
import { getDashboardError } from '@/lib/get-dashboard-error'
import type { ApiLink } from '../../_data-access/get-dashboard'
import { linkSchema } from '../_components/link-schema'

const updateLinkSchema = linkSchema
  .extend({
    isActive: z.boolean(),
    startsAt: z.date().nullable(),
    endsAt: z.date().nullable(),
  })
  .partial()

export async function updateLink(
  id: string,
  input: z.input<typeof updateLinkSchema>,
): Promise<{ data?: ApiLink; error?: string }> {
  try {
    const linkId = z.uuid().parse(id)

    const { startsAt, endsAt, ...values } = updateLinkSchema.parse(input)

    const { data } = await api.patch<ApiLink>(
      `/links/${linkId}`,
      {
        ...values,
        ...(startsAt !== undefined && { startsAt: startsAt?.toISOString() ?? null }),
        ...(endsAt !== undefined && { endsAt: endsAt?.toISOString() ?? null }),
      },
      { headers: await getApiAuthorization() },
    )

    revalidatePath('/[locale]/dashboard', 'layout')

    return { data }
  } catch (error) {
    return { error: getDashboardError(error, 'Não foi possível atualizar o link') }
  }
}
