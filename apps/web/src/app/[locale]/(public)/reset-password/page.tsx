import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { AuthShell } from '../_components/auth-shell'
import { ResetPasswordForm } from './_components/reset-password-form'

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/reset-password'>): Promise<Metadata> {
  const { locale } = await params

  const t = await getTranslations({ locale, namespace: 'Auth.ResetPassword' })

  return { title: t('title'), robots: { index: false, follow: false } }
}

export default async function ResetPasswordPage({
  searchParams,
}: PageProps<'/[locale]/reset-password'>) {
  const { token } = await searchParams

  return (
    <AuthShell>
      <ResetPasswordForm token={typeof token === 'string' && token ? token : undefined} />
    </AuthShell>
  )
}
