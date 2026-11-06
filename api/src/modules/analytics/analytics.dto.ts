import { z } from 'zod'
import { socialPlatformSchema } from '../pages/pages.social'

export const recordViewBody = z.object({
  pageId: z.uuid(),
  eventId: z.uuid(),
})

export const linkRedirectParams = z.object({
  linkId: z.uuid(),
})

export const socialRedirectParams = z.object({
  pageId: z.uuid(),
  platform: socialPlatformSchema,
})

const eventBase = {
  eventId: z.uuid(),
  pageId: z.uuid(),
  occurredAt: z.iso.datetime(),
}

export const analyticsEvent = z.discriminatedUnion('type', [
  z.object({ ...eventBase, type: z.literal('view') }),
  z.object({ ...eventBase, type: z.literal('link_click'), linkId: z.uuid() }),
  z.object({ ...eventBase, type: z.literal('social_click'), platform: socialPlatformSchema }),
])

export type RecordViewBody = z.infer<typeof recordViewBody>

export type AnalyticsEvent = z.infer<typeof analyticsEvent>

export const periodQuery = z.object({
  period: z.enum(['7d', '30d', '90d']).default('7d'),
})

export const overviewResponse = z.object({
  pageViews: z.number(),
  linkClicks: z.number(),
  socialClicks: z.number(),
  totalClicks: z.number(),
  ctr: z.number(),
})

export const timeseriesResponse = z.array(
  z.object({ date: z.string(), views: z.number(), clicks: z.number() }),
)

export const topLinksResponse = z.array(
  z.object({
    linkId: z.uuid(),
    title: z.string().nullable(),
    clicks: z.number(),
    share: z.number(),
  }),
)

export const socialResponse = z.array(
  z.object({ platform: z.string(), clicks: z.number(), share: z.number() }),
)

export type Period = z.infer<typeof periodQuery>['period']
