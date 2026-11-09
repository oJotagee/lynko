import { createRemoteJWKSet, errors, type JWTVerifyGetKey, jwtVerify } from 'jose'

import { env } from '../../config/env'
import { ServiceUnavailableError, UnauthorizedError } from '../../shared/errors'

const GOOGLE_ISSUERS = ['https://accounts.google.com', 'accounts.google.com']

const GOOGLE_ID_MAX_LENGTH = 32

const googleKeys = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'))

function invalidToken() {
  return new UnauthorizedError('Invalid Google token')
}

export const googleAuth = {
  async verifyIdToken(idToken: string, getKey: JWTVerifyGetKey = googleKeys) {
    if (!env.GOOGLE_CLIENT_ID) throw new ServiceUnavailableError('Google login is not configured')

    try {
      const { payload } = await jwtVerify(idToken, getKey, {
        issuer: GOOGLE_ISSUERS,
        audience: env.GOOGLE_CLIENT_ID,
        algorithms: ['RS256'],
      })

      const { sub, email, email_verified: emailVerified, name } = payload

      if (
        typeof sub !== 'string' ||
        sub.length === 0 ||
        sub.length > GOOGLE_ID_MAX_LENGTH ||
        typeof email !== 'string' ||
        email.length === 0 ||
        emailVerified !== true
      ) {
        throw invalidToken()
      }

      return {
        googleId: sub,
        email: email.trim().toLowerCase(),
        name: typeof name === 'string' ? name.trim() : '',
      }
    } catch (error) {
      if (error instanceof UnauthorizedError) throw error

      if (error instanceof errors.JOSEError) throw invalidToken()

      throw error
    }
  },
}
