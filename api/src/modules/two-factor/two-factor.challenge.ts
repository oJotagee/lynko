import { jwtVerify, SignJWT } from 'jose'
import { env } from '../../config/env'
import { hashSecret } from '../../shared/token'

const AUDIENCE = 'lynko:two-factor'

const EXPIRES_IN = '5m'

const key = new TextEncoder().encode(env.JWT_SECRET)

function passwordStamp(passwordHash: string) {
  return hashSecret(passwordHash).slice(0, 32)
}

export async function createChallenge(userId: string, passwordHash: string) {
  return new SignJWT({ pwd: passwordStamp(passwordHash) })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(EXPIRES_IN)
    .sign(key)
}

export async function readChallenge(token: string) {
  try {
    const { payload } = await jwtVerify(token, key, {
      audience: AUDIENCE,
      algorithms: ['HS256'],
    })

    if (!payload.sub || typeof payload.pwd !== 'string') return null

    return { userId: payload.sub, passwordStamp: payload.pwd }
  } catch {
    return null
  }
}

export function challengeMatchesPassword(stamp: string, passwordHash: string) {
  return stamp === passwordStamp(passwordHash)
}
