'use server'

import { revalidatePath } from 'next/cache'
import {
  type SocialLinkData,
  socialLinksSchema,
} from '@/app/[locale]/_components/social-links/social-link-schema'
import { api } from '@/lib/api'
import { getApiAuthorization } from '@/lib/get-api-authorization'
import { getDashboardError } from '@/lib/get-dashboard-error'

export async function updateSocialLinks(input: SocialLinkData[]): Promise<{ error?: string }> {
  try {
    await api.patch(
      '/pages/me',
      { socialLinks: socialLinksSchema.parse(input) },
      { headers: await getApiAuthorization() },
    )

    revalidatePath('/[locale]/dashboard', 'layout')

    return {}
  } catch (error) {
    return { error: getDashboardError(error, 'Não foi possível salvar suas redes sociais') }
  }
}
