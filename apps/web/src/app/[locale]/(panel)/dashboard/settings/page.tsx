import type { Metadata } from 'next'
import { Suspense } from 'react'

import { DashboardPageSkeleton } from '../_components/dashboard-page-skeleton'
import { SettingsContent } from './_components/settings-content'

export const metadata: Metadata = { title: 'Configurações' }

export default function SettingsPage() {
  return (
    <Suspense fallback={<DashboardPageSkeleton title="Configurações" section="settings" />}>
      <SettingsContent />
    </Suspense>
  )
}
