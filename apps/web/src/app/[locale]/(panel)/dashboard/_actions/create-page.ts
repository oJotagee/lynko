'use server'

import { revalidatePath } from 'next/cache'

import { appearanceToTheme, type DashboardData } from '../_components/dashboard-data'
import { profileSchema, themeSchema } from '../_components/profile-schema'
import { getApiAuthorization } from '@/lib/get-api-authorization'
import { getDashboardError } from '@/lib/get-dashboard-error'
import type { ApiPage } from '../_data-access/get-dashboard'
import { api } from '@/lib/api'

export async function createPage(
  input: DashboardData,
): Promise<{ data?: ApiPage; error?: string }> {
  try {
    const profile = profileSchema.parse(input.profile)

    const { data } = await api.post<ApiPage>(
      '/pages',
      {
        username: profile.username,
        title: profile.name,
        bio: profile.bio || undefined,
        avatarUrl: profile.image || undefined,
        theme: appearanceToTheme(themeSchema.parse(input.appearance)),
      },
      { headers: await getApiAuthorization() },
    )

    revalidatePath('/[locale]/dashboard', 'layout')

    return { data }
  } catch (error) {
    return {
      error: getDashboardError(
        error,
        'Não foi possível criar sua página. Confira os dados e tente novamente.',
      ),
    }
  }
}
