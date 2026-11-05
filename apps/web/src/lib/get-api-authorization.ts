import { cookies, headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

import { handlers } from './auth'
import { SESSION_EXPIRED_DIGEST } from './session-expired'

export class SessionExpiredError extends Error {
  readonly digest = SESSION_EXPIRED_DIGEST

  constructor() {
    super('Sua sessão expirou. Entre novamente para continuar.')
  }
}

export async function getApiAuthorization(): Promise<{ Authorization: string }> {
  const request = new NextRequest(
    new URL('/api/auth/session', process.env.AUTH_URL ?? 'http://localhost:3000'),
    { headers: await headers() },
  )

  return getAuthorizationFromRequest(request, async (refreshed) => {
    try {
      const jar = await cookies()

      for (const cookie of refreshed) jar.set(cookie)
    } catch {}
  })
}

export async function getAuthorizationFromRequest(
  request: NextRequest,
  persistCookies: (refreshed: ReturnType<NextResponse['cookies']['getAll']>) => Promise<void>,
): Promise<{ Authorization: string }> {
  const secureCookie =
    request.cookies.has('__Secure-authjs.session-token') ||
    request.cookies.has('__Secure-authjs.session-token.0')

  const options = { req: request, secret: process.env.AUTH_SECRET, secureCookie }

  let token = await getToken(options)

  if (token?.accessTokenExpiresAt && Date.now() >= token.accessTokenExpiresAt) {
    const response = await handlers.GET(request)

    const refreshed = new NextResponse(null, { headers: response.headers }).cookies.getAll()

    await persistCookies(refreshed)

    for (const cookie of refreshed) {
      request.cookies.set(cookie.name, cookie.value)
    }

    token = await getToken(options)
  }

  if (
    !token?.accessToken ||
    !token.accessTokenExpiresAt ||
    Date.now() >= token.accessTokenExpiresAt
  ) {
    throw new SessionExpiredError()
  }

  return { Authorization: `Bearer ${token.accessToken}` }
}
