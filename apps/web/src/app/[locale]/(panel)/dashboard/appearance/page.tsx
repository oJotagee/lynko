import type { Metadata } from 'next'
import { Suspense } from 'react'

import { DashboardPageSkeleton } from '../_components/skeletons/dashboard-page-skeleton'
import { AppearanceContent } from './_components/appearance-content'
import { AppearanceSkeleton } from './_components/appearance-skeleton'

export const metadata: Metadata = { title: 'Aparência' }

export default function AppearancePage() {
  return (
    <Suspense
      fallback={
        <DashboardPageSkeleton title="Aparência">
          <AppearanceSkeleton />
        </DashboardPageSkeleton>
      }
    >
      <AppearanceContent />
    </Suspense>
  )
}
