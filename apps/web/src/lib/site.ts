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
