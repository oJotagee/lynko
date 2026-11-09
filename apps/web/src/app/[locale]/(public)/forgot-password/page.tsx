import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { AuthShell } from '../_components/auth-shell'
import { ForgotPasswordForm } from './_components/forgot-password-form'

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/forgot-password'>): Promise<Metadata> {
  const { locale } = await params

  const t = await getTranslations({ locale, namespace: 'Auth.ForgotPassword' })

  return { title: t('title'), robots: { index: false, follow: true } }
}

export default function ForgotPasswordPage() {
  return (
    <AuthShell>
      <ForgotPasswordForm />
    </AuthShell>
  )
}
