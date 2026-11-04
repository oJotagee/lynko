'use server'

import { isAxiosError } from 'axios'
import { cache } from 'react'

import { getApiAuthorization, SessionExpiredError } from '@/lib/get-api-authorization'
import { getApiErrorMessage } from '@/lib/api-error'
import { api } from '@/lib/api'

export interface PageTheme {
  backgroundColor: string
  textColor: string
  buttonColor: string
  buttonTextColor: string
  buttonStyle: 'filled' | 'outline'
  buttonRadius: 'none' | 'small' | 'medium' | 'full'
}

export interface ApiUser {
  id: string
  name: string
  email: string
}

export interface ApiLink {
  id: string
  title: string
  url: string
  position: number
  isActive: boolean
}

export interface ApiPage {
  id: string
  username: string
  title: string
  bio: string | null
  avatarUrl: string | null
  theme: PageTheme
  isPublished: boolean
  updatedAt: string
}

export interface ApiDashboard {
  user: ApiUser
  page: ApiPage | null
  links: ApiLink[]
}

const loadDashboard = cache(async (): Promise<ApiDashboard> => {
  try {
    const headers = await getApiAuthorization()

    const { data: user } = await api.get<ApiUser>('/users/me', { headers })

    let page: ApiPage

    try {
      page = (await api.get<ApiPage>('/pages/me', { headers })).data
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 404)
        return { user, page: null, links: [] }

      throw error
    }

    const { data: links } = await api.get<ApiLink[]>('/links', { headers })

    return { user, page, links }
  } catch (error) {
    if (
      error instanceof SessionExpiredError ||
      (isAxiosError(error) && error.response?.status === 401)
    )
      throw new SessionExpiredError()

    throw new Error(
      getApiErrorMessage(
        error,
        error instanceof Error && !isAxiosError(error)
          ? error.message
          : 'Não foi possível carregar seu dashboard. Tente novamente.',
      ),
    )
  }
})

export async function getDashboard(): Promise<ApiDashboard> {
  return loadDashboard()
}
