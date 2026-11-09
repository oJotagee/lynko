import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { AuthShell } from '../_components/auth-shell'
import { ConfirmDeletionCard } from './_components/confirm-deletion-card'

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/confirm-deletion'>): Promise<Metadata> {
  const { locale } = await params

  const t = await getTranslations({ locale, namespace: 'Auth.ConfirmDeletion' })

  return { title: t('title'), robots: { index: false, follow: false } }
}

export default async function ConfirmDeletionPage({
  searchParams,
}: PageProps<'/[locale]/confirm-deletion'>) {
  const { token } = await searchParams

  return (
    <AuthShell>
      <ConfirmDeletionCard token={typeof token === 'string' && token ? token : undefined} />
    </AuthShell>
  )
}
