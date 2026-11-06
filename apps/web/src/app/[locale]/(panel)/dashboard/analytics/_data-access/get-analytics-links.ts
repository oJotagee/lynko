'use server'

import type { AnalyticsPeriod } from './analytics-period'
import { fetchAnalytics } from './fetch-analytics'

export interface AnalyticsTopLink {
  linkId: string
  title: string | null
  clicks: number
  share: number
}

export async function getAnalyticsLinks(period: AnalyticsPeriod): Promise<AnalyticsTopLink[]> {
  return fetchAnalytics<AnalyticsTopLink[]>('links', period)
}
