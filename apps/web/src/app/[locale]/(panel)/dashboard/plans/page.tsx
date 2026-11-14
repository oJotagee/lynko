import type { Metadata } from 'next'
import { Suspense } from 'react'

import { DashboardPageSkeleton } from '../_components/skeletons/dashboard-page-skeleton'
import { Plans } from './_components/plans'
import { PlansContent } from './_components/plans-content'
import { PlansSkeleton } from './_components/plans-skeleton'

export const metadata: Metadata = { title: 'Planos' }

export default function PlansPage() {
  return (
    <Suspense
      fallback={
        <DashboardPageSkeleton title="Planos">
          <PlansSkeleton />
        </DashboardPageSkeleton>
      }
    >
      <PlansContent>
        <Plans />
      </PlansContent>
    </Suspense>
  )
}
