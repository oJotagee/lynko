import { type AxiosResponse, isAxiosError } from 'axios'
import NextAuth, { CredentialsSignin } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
import { z } from 'zod'
import { api } from './api'
import { getClientUserAgentHeader } from './client-user-agent'
import { type ApiTokens, readApiTokens } from './read-api-tokens'
import { signInWithGoogle } from './sign-in-with-google'
import { type UserSession, userSessionSchema } from './user-session'

const REFRESH_REUSE_MS = 30_000

const globalRefreshes = globalThis as typeof globalThis & {
  lynkoRefreshes?: Map<string, { at: number; tokens: Promise<ApiTokens> }>
}

globalRefreshes.lynkoRefreshes ??= new Map()

const refreshes = globalRefreshes.lynkoRefreshes

function refreshTokens(refreshToken: string): Promise<ApiTokens> {
  const now = Date.now()

  for (const [key, entry] of refreshes) {
    if (now - entry.at > REFRESH_REUSE_MS) refreshes.delete(key)
  }

  const cached = refreshes.get(refreshToken)

  if (cached) return cached.tokens

  const tokens = api
    .post<{ accessToken: string }>('/auth/refresh', null, {
      headers: { Cookie: `refreshToken=${refreshToken}` },
    })
    .then(readApiTokens)

  refreshes.set(refreshToken, { at: now, tokens })

  tokens.catch(() => refreshes.delete(refreshToken))

  return tokens
}

class TooManyLoginAttempts extends CredentialsSignin {
  code = 'too_many_attempts'
}

class SignInUnavailable extends CredentialsSignin {
  code = 'unavailable'
}

export class TwoFactorRequired extends CredentialsSignin {
  code = 'two_factor_required'

  constructor(readonly challengeToken: string) {
    super()
  }
}

class InvalidTwoFactorCode extends CredentialsSignin {
  code = 'invalid_code'
}

class TwoFactorExpired extends CredentialsSignin {
  code = 'two_factor_expired'
}

const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email().max(50)),
  password: z.string().min(1).max(72),
})

const twoFactorSchema = z.union([
  z.object({ challengeToken: z.string().min(1).max(1024), code: z.string().regex(/^\d{6}$/) }),
  z.object({
    challengeToken: z.string().min(1).max(1024),
    recoveryCode: z
      .string()
      .trim()
      .regex(/^[a-z2-7]{5}-?[a-z2-7]{5}$/i),
  }),
])

type LoginResponse = { accessToken: string } | { twoFactorRequired: true; challengeToken: string }

async function toSessionUser(response: AxiosResponse<{ accessToken: string }>) {
  const tokens = readApiTokens(response)

  const { data } = await api.get<UserSession>('/users/me', {
    headers: { Authorization: `Bearer ${tokens.accessToken}` },
  })

  return { ...userSessionSchema.parse(data), ...tokens }
}

function apiMessage(error: unknown) {
  return isAxiosError(error) ? error.response?.data?.message : undefined
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: 'jwt' },
  pages: { signIn: '/login', error: '/login' },
  providers: [
    Credentials({
      credentials: {
        email: { label: 'E-mail', type: 'email' },
        password: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials) {
        const input = credentialsSchema.safeParse(credentials)

        if (!input.success) return null

        try {
          const response = await api.post<LoginResponse>('/auth/login', input.data, {
            headers: await getClientUserAgentHeader(),
          })

          if ('twoFactorRequired' in response.data) {
            throw new TwoFactorRequired(response.data.challengeToken)
          }

          return await toSessionUser(response as AxiosResponse<{ accessToken: string }>)
        } catch (error) {
          if (error instanceof CredentialsSignin) throw error

          if (isAxiosError(error) && error.response?.status === 401) return null

          if (isAxiosError(error) && error.response?.status === 429) {
            throw new TooManyLoginAttempts()
          }

          throw new SignInUnavailable()
        }
      },
    }),
    Credentials({
      id: 'two-factor',
      credentials: {
        challengeToken: {},
        code: {},
        recoveryCode: {},
      },
      async authorize(credentials) {
        const input = twoFactorSchema.safeParse(credentials)

        if (!input.success) throw new InvalidTwoFactorCode()

        try {
          const response = await api.post<{ accessToken: string }>(
            '/auth/login/two-factor',
            input.data,
            { headers: await getClientUserAgentHeader() },
          )

          return await toSessionUser(response)
        } catch (error) {
          if (isAxiosError(error) && error.response?.status === 401) {
            if (apiMessage(error) === 'Two-factor challenge expired') throw new TwoFactorExpired()

            throw new InvalidTwoFactorCode()
          }

          if (isAxiosError(error) && error.response?.status === 429) {
            throw new TooManyLoginAttempts()
          }

          throw new SignInUnavailable()
        }
      },
    }),
    Google,
  ],
  callbacks: {
    signIn({ user, account }) {
      if (account?.provider === 'credentials' || account?.provider === 'two-factor') return true

      return signInWithGoogle(user, account)
    },
    async jwt({ token, user, trigger }) {
      if (user) {
        token.accessToken = user.accessToken

        token.refreshToken = user.refreshToken

        token.accessTokenExpiresAt = user.accessTokenExpiresAt

        token.sub = user.id

        token.name = user.name

        token.email = user.email

        token.picture = user.image ?? null

        return token
      }

      if (!token.accessTokenExpiresAt || !token.refreshToken) return null

      if (Date.now() >= token.accessTokenExpiresAt) {
        try {
          Object.assign(token, await refreshTokens(token.refreshToken))
        } catch {
          return null
        }
      }

      if (trigger === 'update') {
        try {
          const { data } = await api.get<UserSession>('/users/me', {
            headers: { Authorization: `Bearer ${token.accessToken}` },
          })

          const profile = userSessionSchema.parse(data)

          if (profile.id !== token.sub) return null

          token.name = profile.name

          token.email = profile.email

          delete token.error
        } catch (error) {
          if (isAxiosError(error) && error.response?.status === 401) return null

          token.error = 'UserUpdateFailed'
        }
      }

      return token
    },
    session({ session, token }) {
      session.user.id = token.sub as string

      session.user.name = token.name ?? null

      session.user.email = token.email ?? session.user.email

      session.user.image = token.picture ?? null

      if (token.error) session.error = token.error

      return session
    },
  },
  events: {
    async signOut(message) {
      if ('token' in message && message.token?.refreshToken) {
        try {
          await api.post('/auth/logout', null, {
            headers: { Cookie: `refreshToken=${message.token.refreshToken}` },
          })
        } catch {}
      }
    },
  },
})
