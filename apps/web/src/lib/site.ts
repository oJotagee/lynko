import type { Metadata } from 'next'

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(
  /\/$/,
  '',
)

export const SITE_NAME = 'Lynko'

export const SITE_DESCRIPTION = 'Todos os seus links em uma única página.'

export const SITE_TITLE = `${SITE_NAME} — ${SITE_DESCRIPTION}`

export const BASE_OPEN_GRAPH = {
  type: 'website',
  locale: 'pt_BR',
  siteName: SITE_NAME,
} satisfies NonNullable<Metadata['openGraph']>

export function getPublicPageUrl(username: string, customDomain?: string | null) {
  return customDomain ? `https://${customDomain}` : `${SITE_URL}/${username}`
}

export function getPublicPageLabel(username: string, customDomain?: string | null) {
  return customDomain ?? `${new URL(SITE_URL).host}/${username}`
}

export function getQrCodeUrl(username: string, customDomain?: string | null) {
  return `${getPublicPageUrl(username, customDomain)}?src=qr`
}
