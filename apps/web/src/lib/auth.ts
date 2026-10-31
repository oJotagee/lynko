import Credentials from 'next-auth/providers/credentials'
import NextAuth, { CredentialsSignin } from 'next-auth'
import Google from 'next-auth/providers/google'
import { isAxiosError } from 'axios'
import { z } from 'zod'

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
          const { data: user } = await api.get<{ id: string; name: string; email: string }>(
            '/users/me',
            { headers: { Authorization: `Bearer ${tokens.accessToken}` } },
          )

          return { ...user, ...tokens }
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
      // shortcut: Google desabilitado até existir integração OAuth na API.
      return account?.provider === 'credentials'
    },
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = user.accessToken
        token.refreshToken = user.refreshToken
        token.accessTokenExpiresAt = user.accessTokenExpiresAt
        return token
      }

      if (!token.accessTokenExpiresAt || !token.refreshToken) return null
      if (Date.now() < token.accessTokenExpiresAt) return token

      try {
        const response = await api.post<{ accessToken: string }>('/auth/refresh', null, {
          headers: { Cookie: `refreshToken=${token.refreshToken}` },
        })

        return { ...token, ...readApiTokens(response) }
      } catch {
        return null
      }
    },
    session({ session, token }) {
      session.user.id = token.sub as string
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
