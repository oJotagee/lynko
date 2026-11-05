import type { Metadata } from 'next'
import { Suspense } from 'react'
import { OverviewContent } from './_components/overview/overview-content'
import { DashboardPageSkeleton } from './_components/skeletons/dashboard-page-skeleton'
import { OverviewSkeleton } from './_components/skeletons/overview-skeleton'

export const metadata: Metadata = {
  title: 'Visão geral',
  robots: { index: false, follow: false },
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <DashboardPageSkeleton title="Visão geral">
          <OverviewSkeleton />
        </DashboardPageSkeleton>
      }
    >
      <OverviewContent />
    </Suspense>
  )
}
