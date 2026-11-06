export const ANALYTICS_PERIODS = ['7d', '30d', '90d'] as const

export type AnalyticsPeriod = (typeof ANALYTICS_PERIODS)[number]
