import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'
import { z } from 'zod'

export function createRefreshToken(sessionId: string) {
  const secret = randomBytes(32).toString('base64url')

  return { token: `${sessionId}.${secret}`, secretHash: hashSecret(secret) }
}

export function parseRefreshToken(token: string) {
  const [sessionId, secret, ...rest] = token.split('.')

  if (!sessionId || !secret || rest.length > 0) return null
  if (!z.uuid().safeParse(sessionId).success) return null

  return { sessionId, secret }
}

export function hashSecret(secret: string) {
  return createHash('sha256').update(secret).digest('hex')
}

export function secretMatchesHash(secret: string, hash: string) {
  const a = Buffer.from(hashSecret(secret))
  const b = Buffer.from(hash)

  return a.length === b.length && timingSafeEqual(a, b)
}
