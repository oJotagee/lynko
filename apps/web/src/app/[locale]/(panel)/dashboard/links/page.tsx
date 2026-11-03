import type { Metadata } from 'next'
import { Suspense } from 'react'

import { DashboardPageSkeleton } from '../_components/skeletons/dashboard-page-skeleton'
import { LinksContent } from './_components/links-content'

export const metadata: Metadata = { title: 'Meus links' }

interface LinksPageProps {
  searchParams: Promise<{ new?: string }>
}

export default function LinksPage({ searchParams }: LinksPageProps) {
  return (
    <Suspense fallback={<DashboardPageSkeleton title="Meus links" section="links" />}>
      <LinksContent searchParams={searchParams} />
    </Suspense>
  )
}
