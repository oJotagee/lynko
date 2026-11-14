import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'
import { env } from '../../config/env'

const ALGORITHM = 'aes-256-gcm'

const IV_BYTES = 12

export function encryptSecret(secret: string) {
  const iv = randomBytes(IV_BYTES)

  const cipher = createCipheriv(ALGORITHM, env.TOTP_ENCRYPTION_KEY, iv)

  const ciphertext = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()])

  return [iv, cipher.getAuthTag(), ciphertext].map((part) => part.toString('base64url')).join('.')
}

export function decryptSecret(payload: string) {
  const [iv, tag, ciphertext, ...rest] = payload.split('.')

  if (!iv || !tag || !ciphertext || rest.length > 0) throw new Error('Invalid encrypted secret')

  const decipher = createDecipheriv(
    ALGORITHM,
    env.TOTP_ENCRYPTION_KEY,
    Buffer.from(iv, 'base64url'),
  )

  decipher.setAuthTag(Buffer.from(tag, 'base64url'))

  return Buffer.concat([
    decipher.update(Buffer.from(ciphertext, 'base64url')),
    decipher.final(),
  ]).toString('utf8')
}
