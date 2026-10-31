import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { LegalNotice } from '../_components/legal-notice'
import { PasswordVisibilityProvider } from '../_components/password-visibility'
import { LoginBrand } from '../login/_components/login-brand'
import { RegisterCard } from './_components/register-card'

export async function generateMetadata({
  params,
}: PageProps<'/[locale]/register'>): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'Auth.Register' })

  return { title: t('title'), robots: { index: false, follow: true } }
}

export default function RegisterPage() {
  return (
    <PasswordVisibilityProvider>
      <main className="grid min-h-svh grid-cols-[47.5%_52.5%] bg-[#faf9f6] font-[var(--font-roboto)] text-[#171716] max-[900px]:grid-cols-1">
        <LoginBrand mode="register" />

        <section className="relative flex min-h-svh flex-col items-center justify-center bg-[#faf9f6] px-8 pt-16 pb-[45px] max-[900px]:min-h-[996px] max-[900px]:justify-start max-[900px]:px-8 max-[900px]:pt-[185px] max-[900px]:pb-[110px] max-[600px]:min-h-[745px] max-[600px]:px-[22px] max-[600px]:pt-[52px]">
          <RegisterCard />
          <LegalNotice />
        </section>
      </main>
    </PasswordVisibilityProvider>
  )
}
