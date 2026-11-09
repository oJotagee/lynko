import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { AuthShell } from '../_components/auth-shell'
import { VerifyEmailCard } from './_components/verify-email-card'

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/verify-email'>): Promise<Metadata> {
  const { locale } = await params

  const t = await getTranslations({ locale, namespace: 'Auth.VerifyEmail' })

  return { title: t('title'), robots: { index: false, follow: false } }
}

export default async function VerifyEmailPage({
  searchParams,
}: PageProps<'/[locale]/verify-email'>) {
  const { token } = await searchParams

  return (
    <AuthShell>
      <VerifyEmailCard token={typeof token === 'string' && token ? token : undefined} />
    </AuthShell>
  )
}
