import type { Metadata } from 'next'
import { Suspense } from 'react'

import { DashboardPageSkeleton } from '../_components/skeletons/dashboard-page-skeleton'
import { LinksContent } from './_components/links-content'
import { LinksPageSkeleton } from './_components/links-page-skeleton'

export const metadata: Metadata = { title: 'Meus links' }

interface LinksPageProps {
  searchParams: Promise<{ new?: string }>
}

export default function LinksPage({ searchParams }: LinksPageProps) {
  return (
    <Suspense
      fallback={
        <DashboardPageSkeleton title="Meus links">
          <LinksPageSkeleton />
        </DashboardPageSkeleton>
      }
    >
      <LinksContent searchParams={searchParams} />
    </Suspense>
  )
}
