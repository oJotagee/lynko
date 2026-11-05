import type { Metadata } from 'next'
import { Suspense } from 'react'

import { DashboardPageSkeleton } from '../_components/skeletons/dashboard-page-skeleton'
import { AnalyticsContent } from './_components/analytics-content'
import { AnalyticsSkeleton } from './_components/analytics-skeleton'

export const metadata: Metadata = { title: 'Analytics' }

export default function AnalyticsPage() {
  return (
    <Suspense
      fallback={
        <DashboardPageSkeleton title="Analytics">
          <AnalyticsSkeleton />
        </DashboardPageSkeleton>
      }
    >
      <AnalyticsContent />
    </Suspense>
  )
}
