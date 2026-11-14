import type { Metadata } from 'next'
import { Suspense } from 'react'

import { Skeleton } from '@/components/ui/skeleton'
import { DashboardPageSkeleton } from '../../_components/skeletons/dashboard-page-skeleton'
import { CheckoutStatus } from '../_components/checkout-status'
import { PlansContent } from '../_components/plans-content'

export const metadata: Metadata = { title: 'Pagamento' }

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <DashboardPageSkeleton title="Planos">
          <Skeleton className="h-56 max-w-xl rounded-xl" />
        </DashboardPageSkeleton>
      }
    >
      <PlansContent>
        <CheckoutStatus />
      </PlansContent>
    </Suspense>
  )
}
