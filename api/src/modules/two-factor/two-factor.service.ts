import { createHmac, randomBytes } from 'node:crypto'
import { Secret, TOTP } from 'otpauth'
import { env } from '../../config/env'
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from '../../shared/errors'
import { verifyPassword } from '../../shared/password'
import { mailService } from '../mail/mail.service'
import {
  recoveryCodesRegeneratedMessage,
  twoFactorDisabledMessage,
  twoFactorEnabledMessage,
} from '../mail/mail.templates'
import { decryptSecret, encryptSecret } from './two-factor.crypto'
import type {
  RegenerateRecoveryCodesBody,
  SecondFactor,
  TwoFactorDisableBody,
} from './two-factor.dto'
import { twoFactorRepository } from './two-factor.repository'

const ISSUER = 'Lynko'

const RECOVERY_CODES = 10

const BASE32_ALPHABET = 'abcdefghijklmnopqrstuvwxyz234567'

type TwoFactorUser = NonNullable<Awaited<ReturnType<typeof twoFactorRepository.findUser>>>

function matchStep(encryptedSecret: string, code: string) {
  const secret = Secret.fromBase32(decryptSecret(encryptedSecret))

  const timestamp = Date.now()

  const delta = TOTP.validate({ token: code, secret, timestamp, window: 1 })

  return delta === null ? null : TOTP.counter({ timestamp }) + delta
}

function createRecoveryCodes() {
  return Array.from({ length: RECOVERY_CODES }, () => {
    const chars = Array.from(randomBytes(10), (byte) => BASE32_ALPHABET[byte % 32]).join('')

    return `${chars.slice(0, 5)}-${chars.slice(5)}`
  })
}

function hashRecoveryCode(code: string) {
  return createHmac('sha256', env.TOTP_ENCRYPTION_KEY)
    .update(code.toLowerCase().replace(/[\s-]/g, ''))
    .digest('hex')
}

async function findUser(userId: string) {
  const user = await twoFactorRepository.findUser(userId)

  if (!user) throw new NotFoundError('User not found')

  return user
}

async function checkPassword(user: TwoFactorUser, password: string) {
  if (!user.passwordHash) throw new BadRequestError('Account has no password')

  if (!(await verifyPassword(password, user.passwordHash))) {
    throw new UnauthorizedError('Invalid password')
  }
}

function enabledSecret(user: TwoFactorUser) {
  if (!user.totpEnabledAt || !user.totpSecret) {
    throw new BadRequestError('Two-factor authentication is not enabled')
  }

  return user.totpSecret
}

export const twoFactorService = {
  async verify(user: { id: string; totpSecret: string | null }, factor: SecondFactor) {
    if (!user.totpSecret) return false

    if ('recoveryCode' in factor) {
      return twoFactorRepository.useRecoveryCode(user.id, hashRecoveryCode(factor.recoveryCode))
    }

    const step = matchStep(user.totpSecret, factor.code)

    return step !== null && twoFactorRepository.consumeStep(user.id, user.totpSecret, step)
  },

  async getStatus(userId: string) {
    const user = await findUser(userId)

    const enabled = Boolean(user.totpEnabledAt)

    return {
      enabled,
      recoveryCodesLeft: enabled ? await twoFactorRepository.countRecoveryCodesLeft(userId) : 0,
    }
  },

  async setup(userId: string, password: string) {
    const user = await findUser(userId)

    if (user.totpEnabledAt) throw new ConflictError('Two-factor authentication already enabled')

    await checkPassword(user, password)

    const secret = new Secret({ size: 20 })

    const saved = await twoFactorRepository.savePendingSecret(userId, encryptSecret(secret.base32))

    if (!saved) throw new ConflictError('Two-factor authentication already enabled')

    const otpauthUrl = new TOTP({ issuer: ISSUER, label: user.email, secret }).toString()

    return { secret: secret.base32, otpauthUrl }
  },

  async enable(userId: string, sessionId: string, code: string) {
    const user = await findUser(userId)

    if (user.totpEnabledAt) throw new ConflictError('Two-factor authentication already enabled')

    if (!user.totpPendingSecret) throw new BadRequestError('Two-factor setup not started')

    const step = matchStep(user.totpPendingSecret, code)

    if (step === null) throw new BadRequestError('Invalid code')

    const recoveryCodes = createRecoveryCodes()

    const enabled = await twoFactorRepository.enable(
      userId,
      sessionId,
      user.totpPendingSecret,
      step,
      recoveryCodes.map(hashRecoveryCode),
    )

    if (!enabled) throw new ConflictError('Two-factor setup changed, start again')

    void mailService.sendSafely({ to: user.email, ...twoFactorEnabledMessage(user.name) })

    return { recoveryCodes }
  },

  async disable(userId: string, { password, ...factor }: TwoFactorDisableBody) {
    const user = await findUser(userId)

    const secret = enabledSecret(user)

    await checkPassword(user, password)

    if (!(await twoFactorService.verify(user, factor))) throw new BadRequestError('Invalid code')

    await twoFactorRepository.disable(userId, secret)

    void mailService.sendSafely({ to: user.email, ...twoFactorDisabledMessage(user.name) })
  },

  async regenerateRecoveryCodes(userId: string, { password, code }: RegenerateRecoveryCodesBody) {
    const user = await findUser(userId)

    const secret = enabledSecret(user)

    await checkPassword(user, password)

    if (!(await twoFactorService.verify(user, { code }))) throw new BadRequestError('Invalid code')

    const recoveryCodes = createRecoveryCodes()

    await twoFactorRepository.replaceRecoveryCodes(
      userId,
      secret,
      recoveryCodes.map(hashRecoveryCode),
    )

    void mailService.sendSafely({ to: user.email, ...recoveryCodesRegeneratedMessage(user.name) })

    return { recoveryCodes }
  },
}
