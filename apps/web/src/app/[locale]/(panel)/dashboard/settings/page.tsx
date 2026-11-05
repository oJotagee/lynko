import type { Metadata } from 'next'
import { Suspense } from 'react'

import { DashboardPageSkeleton } from '../_components/skeletons/dashboard-page-skeleton'
import { SettingsContent } from './_components/settings-content'
import { SettingsSkeleton } from './_components/settings-skeleton'

export const metadata: Metadata = { title: 'Configurações' }

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <DashboardPageSkeleton title="Configurações">
          <SettingsSkeleton />
        </DashboardPageSkeleton>
      }
    >
      <SettingsContent />
    </Suspense>
  )
}
