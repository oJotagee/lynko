'use server'

import { isAxiosError } from 'axios'
import { cache } from 'react'

import type { PageAppearance } from '@/app/[locale]/_components/appearance-schema'
import type { SocialLinkData } from '@/app/[locale]/_components/social-links/social-link-schema'
import { api } from '@/lib/api'
import { getApiErrorMessage } from '@/lib/api-error'

export interface ApiPublicPage {
  id: string
  username: string
  title: string
  bio: string | null
  avatarUrl: string | null
  backgroundImageUrl: string | null
  appearance: PageAppearance
  socialLinks: Pick<SocialLinkData, 'platform' | 'url'>[]
  links: { id: string; title: string; url: string }[]
}

const loadPublicPage = cache(async (username: string): Promise<ApiPublicPage | null> => {
  try {
    const { data } = await api.get<ApiPublicPage>(`/pages/${encodeURIComponent(username)}`)

    return data
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 404) return null

    throw new Error(getApiErrorMessage(error, 'Não foi possível carregar esta página.'))
  }
})

export async function getPublicPage(username: string): Promise<ApiPublicPage | null> {
  return loadPublicPage(username)
}
