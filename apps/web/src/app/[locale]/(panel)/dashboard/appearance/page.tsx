import type { Metadata } from 'next'
import { Suspense } from 'react'

import { DashboardPageSkeleton } from '../_components/dashboard-page-skeleton'
import { AppearanceContent } from './_components/appearance-content'

export const metadata: Metadata = { title: 'Aparência' }

export default function AppearancePage() {
  return (
    <Suspense fallback={<DashboardPageSkeleton title="Aparência" section="appearance" />}>
      <AppearanceContent />
    </Suspense>
  )
}
