import type { DefaultSession } from 'next-auth'
import 'next-auth/jwt'

import type { ApiTokens } from '@/lib/read-api-tokens'

declare module 'next-auth' {
  interface Session {
    user: { id: string } & DefaultSession['user']
  }

  interface User extends Partial<ApiTokens> {}
}

declare module 'next-auth/jwt' {
  interface JWT extends Partial<ApiTokens> {}
}
