'use server'

import type { AnalyticsPeriod } from './analytics-period'
import { fetchAnalytics } from './fetch-analytics'

export interface AnalyticsTimeseriesPoint {
  date: string
  views: number
  clicks: number
}

export async function getAnalyticsTimeseries(
  period: AnalyticsPeriod,
): Promise<AnalyticsTimeseriesPoint[]> {
  return fetchAnalytics<AnalyticsTimeseriesPoint[]>('timeseries', period)
}
