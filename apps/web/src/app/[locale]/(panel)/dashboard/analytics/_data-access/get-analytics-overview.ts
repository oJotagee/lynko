'use server'

import type { AnalyticsPeriod } from './analytics-period'
import { fetchAnalytics } from './fetch-analytics'

export interface AnalyticsOverview {
  pageViews: number
  linkClicks: number
  socialClicks: number
  totalClicks: number
  ctr: number
}

export async function getAnalyticsOverview(period: AnalyticsPeriod): Promise<AnalyticsOverview> {
  return fetchAnalytics<AnalyticsOverview>('overview', period)
}
