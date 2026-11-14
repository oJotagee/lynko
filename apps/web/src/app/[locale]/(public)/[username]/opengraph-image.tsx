import { notFound } from 'next/navigation'
import { ImageResponse } from 'next/og'
import { ShareImage } from './_components/share-image'
import { getPublicPage } from './_data-access/get-public-page'

export const alt = 'Prévia da página no Lynko'

export const size = { width: 1200, height: 630 }

export const contentType = 'image/png'

export default async function Image({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params

  const page = await getPublicPage(username)

  if (!page) notFound()

  return new ImageResponse(<ShareImage page={page} />, {
    ...size,
    headers: { 'cache-control': 'public, max-age=3600, s-maxage=3600' },
  })
}
