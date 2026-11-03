import Credentials from 'next-auth/providers/credentials'
import NextAuth, { CredentialsSignin } from 'next-auth'
import Google from 'next-auth/providers/google'
import { isAxiosError } from 'axios'
import { z } from 'zod'

import { type UserSession, userSessionSchema } from './user-session'
import { readApiTokens } from './read-api-tokens'
import { api } from './api'

class TooManyLoginAttempts extends CredentialsSignin {
  code = 'too_many_attempts'
}

class SignInUnavailable extends CredentialsSignin {
  code = 'unavailable'
}

const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email().max(50)),
  password: z.string().min(1).max(72),
})

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
          const response = await api.post<{ accessToken: string }>('/auth/login', input.data)

          const tokens = readApiTokens(response)

          const { data } = await api.get<UserSession>('/users/me', {
            headers: { Authorization: `Bearer ${tokens.accessToken}` },
          })

          return { ...userSessionSchema.parse(data), ...tokens }
        } catch (error) {
          if (isAxiosError(error) && error.response?.status === 401) return null

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
    signIn({ account }) {
      return account?.provider === 'credentials'
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
          const response = await api.post<{ accessToken: string }>('/auth/refresh', null, {
            headers: { Cookie: `refreshToken=${token.refreshToken}` },
          })

          Object.assign(token, readApiTokens(response))
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
        } catch {
          // A sessão local deve ser encerrada mesmo quando a API estiver indisponível.
        }
      }
    },
  },
})
