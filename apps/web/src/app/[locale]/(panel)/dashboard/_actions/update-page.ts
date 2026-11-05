'use server'

import { revalidatePath } from 'next/cache'
import { appearanceSchema } from '@/app/[locale]/_components/appearance-schema'
import { socialLinksSchema } from '@/app/[locale]/_components/social-links/social-link-schema'
import { api } from '@/lib/api'
import { getApiAuthorization } from '@/lib/get-api-authorization'
import { getDashboardError } from '@/lib/get-dashboard-error'
import type { DashboardData } from '../_components/dashboard-data'
import { profileSchema } from '../_components/profile/profile-schema'
import type { ApiPage } from '../_data-access/get-dashboard'

export async function updatePage(
  input: DashboardData,
): Promise<{ data?: ApiPage; error?: string }> {
  try {
    const profile = profileSchema.parse(input.profile)

    const { data } = await api.patch<ApiPage>(
      '/pages/me',
      {
        username: profile.username,
        title: profile.name,
        bio: profile.bio || null,
        avatarUrl: profile.avatarMediaId ? null : profile.image || null,
        avatarMediaId: profile.avatarMediaId,
        isPublished: profile.published,
        appearance: appearanceSchema.parse(input.appearance),
        socialLinks: socialLinksSchema.parse(input.socialLinks),
      },
      { headers: await getApiAuthorization() },
    )

    revalidatePath('/[locale]/dashboard', 'layout')

    return { data }
  } catch (error) {
    return {
      error: getDashboardError(
        error,
        'Não foi possível salvar sua página. Confira os dados e tente novamente.',
      ),
    }
  }
}
