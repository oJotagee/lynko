import { BadRequestError, NotFoundError } from '../../shared/errors'
import { authRepository } from './auth.repository'
import { parseUserAgent } from './auth.user-agent'

export const sessionsService = {
  async list(userId: string, currentSessionId: string) {
    const sessions = await authRepository.listActiveSessions(userId)

    return sessions
      .map(({ id, userAgent, createdAt, updatedAt }) => ({
        id,
        ...parseUserAgent(userAgent),
        createdAt,
        lastActiveAt: updatedAt,
        current: id === currentSessionId,
      }))
      .sort((a, b) => Number(b.current) - Number(a.current))
  },

  async revoke(userId: string, currentSessionId: string, sessionId: string) {
    if (sessionId === currentSessionId) {
      throw new BadRequestError('Use logout to end the current session')
    }

    const revoked = await authRepository.revokeUserSession(userId, sessionId)

    if (!revoked) throw new NotFoundError('Session not found')
  },

  async revokeOthers(userId: string, currentSessionId: string) {
    const revoked = await authRepository.revokeOtherSessions(userId, currentSessionId)

    return { revoked }
  },
}
