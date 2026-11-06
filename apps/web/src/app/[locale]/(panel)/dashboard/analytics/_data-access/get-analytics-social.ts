'use server'

import type { AnalyticsPeriod } from './analytics-period'
import { fetchAnalytics } from './fetch-analytics'

export interface AnalyticsSocialItem {
  platform: string
  clicks: number
  share: number
}

export async function getAnalyticsSocial(period: AnalyticsPeriod): Promise<AnalyticsSocialItem[]> {
  return fetchAnalytics<AnalyticsSocialItem[]>('social', period)
}
