import type { Metadata } from 'next'
import { Playfair_Display, Roboto } from 'next/font/google'
import { notFound } from 'next/navigation'
import { hasLocale, NextIntlClientProvider } from 'next-intl'
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server'
import { routing } from '@/i18n/routing'
import { BASE_OPEN_GRAPH, SITE_NAME, SITE_TITLE, SITE_URL } from '@/lib/site'
import { cn } from '@/lib/utils'
import { Providers } from '../providers'

import '../globals.css'

const roboto = Roboto({ variable: '--font-roboto', subsets: ['latin'] })
const playfairDisplay = Playfair_Display({
  variable: '--font-playfair-display',
  subsets: ['latin'],
})

export async function generateMetadata({ params }: LayoutProps<'/[locale]'>): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'Metadata' })
  const description = t('description')

  return {
    metadataBase: new URL(SITE_URL),
    title: { default: SITE_TITLE, template: `%s | ${SITE_NAME}` },
    description,
    applicationName: SITE_NAME,
    openGraph: { ...BASE_OPEN_GRAPH, title: SITE_TITLE, description },
    twitter: { card: 'summary_large_image' },
  }
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export default async function LocaleLayout({ children, params }: LayoutProps<'/[locale]'>) {
  const { locale } = await params

  if (!hasLocale(routing.locales, locale)) notFound()
  setRequestLocale(locale)
  const messages = await getMessages()

  return (
    <html
      lang={locale === 'pt' ? 'pt-BR' : 'en'}
      className={cn('h-full', 'antialiased', roboto.variable, playfairDisplay.variable)}
    >
      <body className="min-h-full flex flex-col dark">
        <NextIntlClientProvider messages={messages}>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
