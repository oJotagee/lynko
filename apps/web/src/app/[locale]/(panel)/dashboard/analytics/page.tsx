import type { Metadata } from 'next'
import { Suspense } from 'react'

import { DashboardPageSkeleton } from '../_components/dashboard-page-skeleton'
import { AnalyticsContent } from './_components/analytics-content'

export const metadata: Metadata = { title: 'Analytics' }

export default function AnalyticsPage() {
  return (
    <Suspense fallback={<DashboardPageSkeleton title="Analytics" section="analytics" />}>
      <AnalyticsContent />
    </Suspense>
  )
}
