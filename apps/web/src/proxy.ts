import { type NextRequest, NextResponse } from 'next/server'
import createMiddleware from 'next-intl/middleware'

import { routing } from './i18n/routing'
import { auth } from './lib/auth'
import { isPlatformHost, resolveHost } from './lib/custom-domain'
import { SITE_URL } from './lib/site'

const intlMiddleware = createMiddleware(routing)

const authenticatedProxy = auth((request) => {
  const segments = request.nextUrl.pathname.split('/').filter(Boolean)

  const locale = routing.locales.find((value) => value === segments[0])

  const path = locale ? segments[1] : segments[0]

  const prefix = locale && locale !== routing.defaultLocale ? `/${locale}` : ''

  if (path === 'dashboard' && !request.auth?.user) {
    return NextResponse.redirect(new URL(`${prefix}/login`, request.url))
  }

  if (path === 'login' && request.auth?.user) {
    return NextResponse.redirect(new URL(`${prefix}/dashboard`, request.url))
  }

  return intlMiddleware(request)
})

const OG_IMAGE_PATH = /^\/(opengraph-image|twitter-image)[\w-]*(\/.*)?$/

async function customDomainProxy(request: NextRequest, host: string) {
  const owner = await resolveHost(host)

  if (owner === undefined) return new NextResponse(null, { status: 503 })

  if (owner === null) return new NextResponse(null, { status: 404 })

  const username = encodeURIComponent(owner.username)

  if (!owner.pro) return NextResponse.redirect(`${SITE_URL}/${username}`, 307)

  const { pathname } = request.nextUrl

  const target = request.nextUrl.clone()

  if (pathname === '/') {
    target.pathname = `/${routing.defaultLocale}/${username}`

    return NextResponse.rewrite(target)
  }

  if (OG_IMAGE_PATH.test(pathname)) {
    target.pathname = `/${routing.defaultLocale}/${username}${pathname}`

    return NextResponse.rewrite(target)
  }

  target.pathname = '/'

  target.search = ''

  return NextResponse.redirect(target, 308)
}

export default async function proxy(request: NextRequest) {
  const host = request.nextUrl.hostname.toLowerCase()

  if (!isPlatformHost(host)) return customDomainProxy(request, host)

  if (request.nextUrl.pathname.startsWith('/api/')) return NextResponse.next()

  const response =
    (await authenticatedProxy(request, { params: Promise.resolve({}) })) ?? NextResponse.next()

  const result = new NextResponse(response.body, response)

  for (const cookie of result.cookies.getAll()) result.cookies.set(cookie)

  return result
}

export const config = {
  matcher: ['/((?!api|trpc|_next|_vercel|.*\\..*).*)', '/api/:path*'],
}
