import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'

import { PageView } from '@/app/[locale]/_components/page-view/page-view'
import { getPublicPage } from './_data-access/get-public-page'

const LINK_COLOR = '#9b8cff'

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/[username]'>): Promise<Metadata> {
  const { username } = await params

  const page = await getPublicPage(username)

  if (!page) return {}

  return {
    title: `${page.title} (@${page.username})`,
    description: page.bio ?? undefined,
  }
}

export default async function PublicPage({ params }: PageProps<'/[locale]/[username]'>) {
  const { locale, username } = await params

  setRequestLocale(locale)

  const page = await getPublicPage(username)

  if (!page) notFound()

  return (
    <main>
      <PageView
        headingAs="h1"
        fixedFooter
        className="min-h-svh"
        profile={{
          name: page.title,
          username: page.username,
          bio: page.bio ?? '',
          image: page.avatarUrl ?? '',
        }}
        appearance={page.appearance}
        backgroundImageUrl={page.backgroundImageUrl}
        socialLinks={page.socialLinks.map((link) => ({ ...link, isActive: true }))}
        links={page.links.map((link) => ({ ...link, color: LINK_COLOR }))}
      />
    </main>
  )
}
