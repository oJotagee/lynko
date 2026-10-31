import type { AxiosResponse } from 'axios'
import { z } from 'zod'

export interface ApiTokens {
  accessToken: string
  refreshToken: string
  accessTokenExpiresAt: number
}

export function readApiTokens(response: AxiosResponse<{ accessToken: string }>): ApiTokens {
  const accessToken = z.string().min(1).parse(response.data.accessToken)

  const payload = accessToken.split('.')[1]

  const { exp } = z
    .object({ exp: z.number().positive() })
    .parse(JSON.parse(Buffer.from(payload, 'base64url').toString()))

  const cookie = response.headers['set-cookie']?.find((value: string) =>
    value.startsWith('refreshToken='),
  )

  const refreshToken = cookie?.split(';')[0]?.slice('refreshToken='.length)

  return {
    accessToken,
    refreshToken: z.string().min(1).parse(refreshToken),
    accessTokenExpiresAt: exp * 1000,
  }
}
