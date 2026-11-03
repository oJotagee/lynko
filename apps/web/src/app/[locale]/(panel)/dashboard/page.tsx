import type { Metadata } from 'next'
import { Suspense } from 'react'

import { DashboardPageSkeleton } from './_components/dashboard-page-skeleton'
import { OverviewContent } from './_components/overview-content'

export const metadata: Metadata = {
  title: 'Visão geral',
  robots: { index: false, follow: false },
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardPageSkeleton title="Visão geral" section="dashboard" />}>
      <OverviewContent />
    </Suspense>
  )
}
