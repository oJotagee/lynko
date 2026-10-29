import { randomUUID } from 'node:crypto'

import { createRefreshToken, parseRefreshToken, secretMatchesHash } from '../../shared/token'
import { ConflictError, UnauthorizedError } from '../../shared/errors'
import { hashPassword, verifyPassword } from '../../shared/password'
import type { LoginBody, RegisterBody } from './auth.dto'
import { authRepository } from './auth.repository'
import { env } from '../../config/env'

const UNIQUE_VIOLATION = '23505'

function isUniqueViolation(error: unknown) {
  const cause = error instanceof Error ? (error.cause as { code?: string } | undefined) : undefined

  return cause?.code === UNIQUE_VIOLATION
}

function refreshTokenExpiresAt() {
  return new Date(Date.now() + env.REFRESH_TOKEN_EXPIRES_IN_DAYS * 24 * 60 * 60 * 1000)
}

function isSessionActive(session: { revokedAt: Date | null; expiresAt: Date }) {
  return !session.revokedAt && session.expiresAt > new Date()
}

export const authService = {
  async register({ name, email, password }: RegisterBody) {
    if (await authRepository.existsByEmail(email)) {
      throw new ConflictError('Email already in use')
    }

    const passwordHash = await hashPassword(password)

    try {
      const user = await authRepository.create({ name, email, passwordHash })
      if (!user) throw new Error('Failed to create user')

      return user
    } catch (error) {
      if (isUniqueViolation(error)) throw new ConflictError('Email already in use')

      throw error
    }
  },

  async login({ email, password }: LoginBody) {
    const user = await authRepository.findByEmailWithPassword(email)

    const isValid = await verifyPassword(password, user?.passwordHash)

    if (!user || !isValid) {
      throw new UnauthorizedError('Invalid email or password')
    }

    const sessionId = randomUUID()
    const { token, secretHash } = createRefreshToken(sessionId)
    const expiresAt = refreshTokenExpiresAt()

    await authRepository.createSession({
      id: sessionId,
      userId: user.id,
      refreshTokenHash: secretHash,
      expiresAt,
    })

    return { userId: user.id, sessionId, refreshToken: token, refreshTokenExpiresAt: expiresAt }
  },

  async refresh(refreshToken: string | undefined) {
    const parsed = refreshToken ? parseRefreshToken(refreshToken) : null
    if (!parsed) throw new UnauthorizedError('Invalid refresh token')

    const session = await authRepository.findSessionById(parsed.sessionId)
    if (!session || !isSessionActive(session)) {
      throw new UnauthorizedError('Invalid refresh token')
    }

    if (!secretMatchesHash(parsed.secret, session.refreshTokenHash)) {
      await authRepository.revokeSession(session.id)
      throw new UnauthorizedError('Invalid refresh token')
    }

    const { token, secretHash } = createRefreshToken(session.id)
    const expiresAt = refreshTokenExpiresAt()

    await authRepository.rotateSessionToken(session.id, secretHash, expiresAt)

    return {
      userId: session.userId,
      sessionId: session.id,
      refreshToken: token,
      refreshTokenExpiresAt: expiresAt,
    }
  },

  async logout(refreshToken: string | undefined) {
    const parsed = refreshToken ? parseRefreshToken(refreshToken) : null
    if (!parsed) return

    const session = await authRepository.findSessionById(parsed.sessionId)

    if (session && secretMatchesHash(parsed.secret, session.refreshTokenHash)) {
      await authRepository.revokeSession(session.id)
    }
  },

  async isSessionValid(sessionId: string, userId: string) {
    const session = await authRepository.findSessionById(sessionId)

    return Boolean(session && session.userId === userId && isSessionActive(session))
  },
}
