import { randomUUID } from 'node:crypto'

import { BadRequestError } from '../../shared/errors'
import { createRefreshToken, parseRefreshToken, secretMatchesHash } from '../../shared/token'
import { type AuthTokenType, authRepository } from './auth.repository'

const MINUTE_MS = 60 * 1000

export const TOKEN_TTL_MS: Record<AuthTokenType, number> = {
  email_verification: 24 * 60 * MINUTE_MS,
  password_reset: 30 * MINUTE_MS,
  account_deletion: 30 * MINUTE_MS,
}

function invalidToken() {
  return new BadRequestError('Invalid or expired token')
}

async function save(userId: string, type: AuthTokenType, cooldownSeconds?: number) {
  const id = randomUUID()

  const { token, secretHash } = createRefreshToken(id)

  const saved = await authRepository.replaceToken(
    userId,
    type,
    { id, tokenHash: secretHash, expiresAt: new Date(Date.now() + TOKEN_TTL_MS[type]) },
    cooldownSeconds,
  )

  return { token, saved }
}

export const authTokens = {
  async issue(userId: string, type: AuthTokenType) {
    const { token } = await save(userId, type)

    return token
  },

  async issueWithCooldown(userId: string, type: AuthTokenType, cooldownSeconds: number) {
    const { token, saved } = await save(userId, type, cooldownSeconds)

    return saved ? token : null
  },

  async consume(type: AuthTokenType, rawToken: string) {
    const parsed = parseRefreshToken(rawToken)

    if (!parsed) throw invalidToken()

    const stored = await authRepository.findToken(parsed.sessionId, type)

    if (!stored || !secretMatchesHash(parsed.secret, stored.tokenHash)) throw invalidToken()

    const userId = await authRepository.consumeToken(stored.id, type)

    if (!userId) throw invalidToken()

    return userId
  },

  async secondsSinceLastIssue(userId: string, type: AuthTokenType) {
    const createdAt = await authRepository.findLatestTokenCreatedAt(userId, type)

    return createdAt ? Math.floor((Date.now() - createdAt.getTime()) / 1000) : null
  },
}
