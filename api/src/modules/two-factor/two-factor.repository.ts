import { and, count, eq, exists, isNotNull, isNull, lt, ne, or, sql } from 'drizzle-orm'
import { db } from '../../db'
import { recoveryCodeSchema, sessionSchema, userSchema } from '../../db/schema'

function userWithSecret(userId: string, secret: string) {
  return exists(
    db
      .select({ id: userSchema.id })
      .from(userSchema)
      .where(and(eq(userSchema.id, userId), eq(userSchema.totpSecret, secret))),
  )
}

function insertRecoveryCodes(userId: string, secret: string, codeHashes: string[]) {
  return codeHashes.map((codeHash) =>
    db.insert(recoveryCodeSchema).select(
      db
        .select({
          userId: userSchema.id,
          codeHash: sql<string>`${codeHash}::text`.as('code_hash'),
        })
        .from(userSchema)
        .where(and(eq(userSchema.id, userId), eq(userSchema.totpSecret, secret))),
    ),
  )
}

function deleteRecoveryCodes(userId: string, secret: string) {
  return db
    .delete(recoveryCodeSchema)
    .where(and(eq(recoveryCodeSchema.userId, userId), userWithSecret(userId, secret)))
}

export const twoFactorRepository = {
  async findUser(userId: string) {
    const [user] = await db
      .select({
        id: userSchema.id,
        name: userSchema.name,
        email: userSchema.email,
        passwordHash: userSchema.passwordHash,
        totpSecret: userSchema.totpSecret,
        totpPendingSecret: userSchema.totpPendingSecret,
        totpEnabledAt: userSchema.totpEnabledAt,
      })
      .from(userSchema)
      .where(eq(userSchema.id, userId))
      .limit(1)

    return user
  },

  async countRecoveryCodesLeft(userId: string) {
    const [row] = await db
      .select({ total: count() })
      .from(recoveryCodeSchema)
      .where(and(eq(recoveryCodeSchema.userId, userId), isNull(recoveryCodeSchema.usedAt)))

    return row?.total ?? 0
  },

  async savePendingSecret(userId: string, pendingSecret: string) {
    const saved = await db
      .update(userSchema)
      .set({ totpPendingSecret: pendingSecret })
      .where(and(eq(userSchema.id, userId), isNull(userSchema.totpEnabledAt)))
      .returning({ id: userSchema.id })

    return saved.length > 0
  },

  async enable(
    userId: string,
    keepSessionId: string,
    pendingSecret: string,
    step: number,
    codeHashes: string[],
  ) {
    const [enabled] = await db.batch([
      db
        .update(userSchema)
        .set({
          totpSecret: pendingSecret,
          totpPendingSecret: null,
          totpEnabledAt: sql`now()`,
          totpLastStep: step,
          totpFailedAttempts: 0,
          totpLockedUntil: null,
        })
        .where(
          and(
            eq(userSchema.id, userId),
            eq(userSchema.totpPendingSecret, pendingSecret),
            isNull(userSchema.totpEnabledAt),
          ),
        )
        .returning({ id: userSchema.id }),
      deleteRecoveryCodes(userId, pendingSecret),
      ...insertRecoveryCodes(userId, pendingSecret, codeHashes),
      db
        .update(sessionSchema)
        .set({ revokedAt: sql`now()` })
        .where(
          and(
            eq(sessionSchema.userId, userId),
            isNull(sessionSchema.revokedAt),
            ne(sessionSchema.id, keepSessionId),
            userWithSecret(userId, pendingSecret),
          ),
        ),
    ])

    return enabled.length > 0
  },

  async consumeStep(userId: string, secret: string, step: number) {
    const consumed = await db
      .update(userSchema)
      .set({ totpLastStep: step })
      .where(
        and(
          eq(userSchema.id, userId),
          eq(userSchema.totpSecret, secret),
          or(isNull(userSchema.totpLastStep), lt(userSchema.totpLastStep, step)),
        ),
      )
      .returning({ id: userSchema.id })

    return consumed.length > 0
  },

  async useRecoveryCode(userId: string, codeHash: string) {
    const used = await db
      .update(recoveryCodeSchema)
      .set({ usedAt: sql`now()` })
      .where(
        and(
          eq(recoveryCodeSchema.userId, userId),
          eq(recoveryCodeSchema.codeHash, codeHash),
          isNull(recoveryCodeSchema.usedAt),
          exists(
            db
              .select({ id: userSchema.id })
              .from(userSchema)
              .where(and(eq(userSchema.id, userId), isNotNull(userSchema.totpEnabledAt))),
          ),
        ),
      )
      .returning({ id: recoveryCodeSchema.id })

    return used.length > 0
  },

  async registerFailure(userId: string, maxAttempts: number, lockMinutes: number) {
    const reachesLimit = sql`${userSchema.totpFailedAttempts} + 1 >= ${maxAttempts}`

    await db
      .update(userSchema)
      .set({
        totpFailedAttempts: sql`case when ${reachesLimit} then 0 else ${userSchema.totpFailedAttempts} + 1 end`,
        totpLockedUntil: sql`case when ${reachesLimit} then now() + make_interval(mins => ${lockMinutes}) else ${userSchema.totpLockedUntil} end`,
      })
      .where(eq(userSchema.id, userId))
  },

  async clearFailures(userId: string) {
    await db
      .update(userSchema)
      .set({ totpFailedAttempts: 0, totpLockedUntil: null })
      .where(eq(userSchema.id, userId))
  },

  async replaceRecoveryCodes(userId: string, secret: string, codeHashes: string[]) {
    await db.batch([
      deleteRecoveryCodes(userId, secret),
      ...insertRecoveryCodes(userId, secret, codeHashes),
    ])
  },

  async disable(userId: string, secret: string) {
    const [disabled] = await db.batch([
      db
        .update(userSchema)
        .set({
          totpSecret: null,
          totpPendingSecret: null,
          totpEnabledAt: null,
          totpLastStep: null,
          totpFailedAttempts: 0,
          totpLockedUntil: null,
        })
        .where(and(eq(userSchema.id, userId), eq(userSchema.totpSecret, secret)))
        .returning({ id: userSchema.id }),
      db.delete(recoveryCodeSchema).where(
        and(
          eq(recoveryCodeSchema.userId, userId),
          exists(
            db
              .select({ id: userSchema.id })
              .from(userSchema)
              .where(and(eq(userSchema.id, userId), isNull(userSchema.totpEnabledAt))),
          ),
        ),
      ),
    ])

    return disabled.length > 0
  },
}
