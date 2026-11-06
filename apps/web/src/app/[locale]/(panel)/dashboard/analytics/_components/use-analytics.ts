import { useQuery } from '@tanstack/react-query'

import type { AnalyticsPeriod } from '../_data-access/analytics-period'
import { getAnalyticsLinks } from '../_data-access/get-analytics-links'
import { getAnalyticsOverview } from '../_data-access/get-analytics-overview'
import { getAnalyticsSocial } from '../_data-access/get-analytics-social'
import { getAnalyticsTimeseries } from '../_data-access/get-analytics-timeseries'

const staleTime = 60_000

export function useAnalytics(period: AnalyticsPeriod) {
  const overview = useQuery({
    queryKey: ['analytics', 'overview', period],
    queryFn: () => getAnalyticsOverview(period),
    staleTime,
  })

  const timeseries = useQuery({
    queryKey: ['analytics', 'timeseries', period],
    queryFn: () => getAnalyticsTimeseries(period),
    staleTime,
  })

  const links = useQuery({
    queryKey: ['analytics', 'links', period],
    queryFn: () => getAnalyticsLinks(period),
    staleTime,
  })

  const social = useQuery({
    queryKey: ['analytics', 'social', period],
    queryFn: () => getAnalyticsSocial(period),
    staleTime,
  })

  const queries = [overview, timeseries, links, social]

  return {
    overview: overview.data,
    timeseries: timeseries.data,
    links: links.data,
    social: social.data,
    isError: queries.some((query) => query.isError),
    retry: () => {
      for (const query of queries) if (query.isError) void query.refetch()
    },
  }
}
