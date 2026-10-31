import { type NextRequest, NextResponse } from 'next/server'
import createMiddleware from 'next-intl/middleware'

import { routing } from './i18n/routing'
import { auth } from './lib/auth'

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

export default async function proxy(request: NextRequest) {
  const response =
    (await authenticatedProxy(request, { params: Promise.resolve({}) })) ?? NextResponse.next()
  const result = new NextResponse(response.body, response)

  // Disponibiliza o token renovado ao Server Component da mesma requisição.
  for (const cookie of result.cookies.getAll()) result.cookies.set(cookie)

  return result
}

export const config = {
  matcher: '/((?!api|trpc|_next|_vercel|.*\\..*).*)',
}
