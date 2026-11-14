import { randomUUID } from 'node:crypto'
import { env } from '../../config/env'
import { getUniqueViolation } from '../../shared/db-errors'
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
  TooManyRequestsError,
  UnauthorizedError,
} from '../../shared/errors'
import { hashPassword, verifyPassword } from '../../shared/password'
import { createRefreshToken, parseRefreshToken, secretMatchesHash } from '../../shared/token'
import { mailService } from '../mail/mail.service'
import {
  passwordChangedMessage,
  resetPasswordMessage,
  verifyEmailMessage,
} from '../mail/mail.templates'
import {
  challengeMatchesPassword,
  createChallenge,
  readChallenge,
} from '../two-factor/two-factor.challenge'
import { twoFactorRepository } from '../two-factor/two-factor.repository'
import { twoFactorService } from '../two-factor/two-factor.service'
import { usersRepository } from '../users/users.repository'
import type {
  ForgotPasswordBody,
  GoogleLoginBody,
  LoginBody,
  RegisterBody,
  ResetPasswordBody,
  TwoFactorLoginBody,
} from './auth.dto'
import { googleAuth } from './auth.google'
import { authRepository } from './auth.repository'
import { authTokens } from './auth.tokens'

const RESEND_COOLDOWN_SECONDS = 60

const NAME_MAX_LENGTH = 100

const EMAIL_MAX_LENGTH = 50

const TWO_FACTOR_MAX_ATTEMPTS = 5

const TWO_FACTOR_LOCK_MINUTES = 15

type SessionOwner = { id: string; passwordHash: string | null }

type GoogleClaims = Awaited<ReturnType<typeof googleAuth.verifyIdToken>>

async function openSession({ id, passwordHash }: SessionOwner, userAgent: string | null) {
  const sessionId = randomUUID()

  const { token, secretHash } = createRefreshToken(sessionId)

  const expiresAt = refreshTokenExpiresAt()

  const created = await authRepository.createSession(
    { id: sessionId, userId: id, refreshTokenHash: secretHash, expiresAt, userAgent },
    passwordHash,
  )

  if (!created) return null

  return { userId: id, sessionId, refreshToken: token, refreshTokenExpiresAt: expiresAt }
}

async function findOrCreateGoogleUser({
  googleId,
  email,
  name,
}: GoogleClaims): Promise<SessionOwner> {
  const known = await authRepository.findByGoogleId(googleId)

  if (known) return known

  const sameEmail = await authRepository.findByEmailWithPassword(email)

  if (sameEmail) {
    const clearCredentials = !sameEmail.emailVerifiedAt

    const linked =
      !sameEmail.googleId &&
      (await authRepository.linkGoogle(sameEmail.id, googleId, clearCredentials))

    if (linked) {
      return { id: sameEmail.id, passwordHash: clearCredentials ? null : sameEmail.passwordHash }
    }

    const raced = await authRepository.findByGoogleId(googleId)

    if (!raced) throw new ConflictError('Email already linked to another Google account')

    return raced
  }

  if (email.length > EMAIL_MAX_LENGTH) throw new BadRequestError('Email is too long')

  try {
    const created = await authRepository.create({
      name: (name || email.split('@')[0] || email).slice(0, NAME_MAX_LENGTH),
      email,
      googleId,
      passwordHash: null,
      emailVerifiedAt: new Date(),
    })

    if (!created) throw new Error('Failed to create user')

    return { id: created.id, passwordHash: null }
  } catch (error) {
    if (!getUniqueViolation(error)) throw error

    const raced = await authRepository.findByGoogleId(googleId)

    if (!raced) throw new ConflictError('Email already in use')

    return raced
  }
}

function refreshTokenExpiresAt() {
  return new Date(Date.now() + env.REFRESH_TOKEN_EXPIRES_IN_DAYS * 24 * 60 * 60 * 1000)
}

function isSessionActive(session: { revokedAt: Date | null; expiresAt: Date }) {
  return !session.revokedAt && session.expiresAt > new Date()
}

type VerificationRecipient = { id: string; name: string; email: string }

function logMailFailure(message: string, email: string, error: unknown) {
  console.error(message, email, error instanceof Error ? error.message : 'unknown error')
}

function sendVerification({ name, email }: VerificationRecipient, token: string) {
  void mailService.sendSafely({ to: email, ...verifyEmailMessage(name, token) })
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

      authTokens
        .issue(user.id, 'email_verification')
        .then((token) => sendVerification(user, token))
        .catch((error) => logMailFailure('Failed to send verification email', user.email, error))

      return user
    } catch (error) {
      if (getUniqueViolation(error)) throw new ConflictError('Email already in use')

      throw error
    }
  },

  async verifyEmail(token: string) {
    const userId = await authTokens.consume('email_verification', token)

    await authRepository.markEmailVerified(userId)
  },

  async resendVerification(userId: string) {
    const user = await usersRepository.findById(userId)

    if (!user) throw new NotFoundError('User not found')

    if (user.emailVerified) throw new ConflictError('Email already verified')

    const token = await authTokens.issueWithCooldown(
      userId,
      'email_verification',
      RESEND_COOLDOWN_SECONDS,
    )

    if (!token) throw new TooManyRequestsError()

    sendVerification(user, token)

    return { retryAfter: RESEND_COOLDOWN_SECONDS }
  },

  async forgotPassword({ email }: ForgotPasswordBody) {
    const user = await authRepository.findByEmailWithPassword(email)

    if (!user?.passwordHash) return

    authTokens
      .issueWithCooldown(user.id, 'password_reset', RESEND_COOLDOWN_SECONDS)
      .then((token) => {
        if (token) {
          void mailService.sendSafely({ to: user.email, ...resetPasswordMessage(user.name, token) })
        }
      })
      .catch((error) => logMailFailure('Failed to send password reset email', user.email, error))
  },

  async resetPassword({ token, password }: ResetPasswordBody) {
    const userId = await authTokens.consume('password_reset', token)

    const passwordHash = await hashPassword(password)

    await authRepository.resetPasswordAndRevokeSessions(userId, passwordHash)

    const user = await usersRepository.findById(userId)

    if (user) {
      void mailService.sendSafely({ to: user.email, ...passwordChangedMessage(user.name) })
    }
  },

  async login({ email, password }: LoginBody, userAgent: string | null = null) {
    const user = await authRepository.findByEmailWithPassword(email)

    const isValid = await verifyPassword(password, user?.passwordHash)

    if (!user?.passwordHash || !isValid) {
      throw new UnauthorizedError('Invalid email or password')
    }

    if (user.totpEnabledAt) {
      return { challengeToken: await createChallenge(user.id, user.passwordHash) }
    }

    const session = await openSession(user, userAgent)

    if (!session) throw new UnauthorizedError('Invalid email or password')

    return session
  },

  async loginWithTwoFactor(
    { challengeToken, ...factor }: TwoFactorLoginBody,
    userAgent: string | null = null,
  ) {
    const challenge = await readChallenge(challengeToken)

    if (!challenge) throw new UnauthorizedError('Two-factor challenge expired')

    const user = await usersRepository.findWithPassword(challenge.userId)

    if (
      !user?.passwordHash ||
      !user.totpEnabledAt ||
      !challengeMatchesPassword(challenge.passwordStamp, user.passwordHash)
    ) {
      throw new UnauthorizedError('Invalid code')
    }

    if (user.totpLockedUntil && user.totpLockedUntil > new Date()) {
      throw new TooManyRequestsError()
    }

    if (!(await twoFactorService.verify(user, factor))) {
      await twoFactorRepository.registerFailure(
        user.id,
        TWO_FACTOR_MAX_ATTEMPTS,
        TWO_FACTOR_LOCK_MINUTES,
      )

      throw new UnauthorizedError('Invalid code')
    }

    await twoFactorRepository.clearFailures(user.id)

    const session = await openSession(user, userAgent)

    if (!session) throw new UnauthorizedError('Invalid code')

    return session
  },

  async loginWithGoogle({ idToken }: GoogleLoginBody, userAgent: string | null = null) {
    const user = await findOrCreateGoogleUser(await googleAuth.verifyIdToken(idToken))

    const session = await openSession(user, userAgent)

    if (!session) throw new UnauthorizedError('Invalid Google token')

    return session
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
