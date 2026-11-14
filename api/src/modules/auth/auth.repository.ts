import { and, desc, eq, exists, gt, isNull, ne, sql } from 'drizzle-orm'
import { db } from '../../db'
import { authTokenSchema, sessionSchema, userSchema } from '../../db/schema'
import { publicUserColumns } from '../users/users.repository'

type NewSession = typeof sessionSchema.$inferInsert

type NewUser = typeof userSchema.$inferInsert

export type AuthTokenType = (typeof authTokenSchema.$inferSelect)['type']

type NewAuthToken = Pick<typeof authTokenSchema.$inferInsert, 'id' | 'tokenHash' | 'expiresAt'>

export const authRepository = {
  async findByEmailWithPassword(email: string) {
    const [user] = await db.select().from(userSchema).where(eq(userSchema.email, email)).limit(1)

    return user
  },

  async existsByEmail(email: string) {
    const [user] = await db
      .select({ id: userSchema.id })
      .from(userSchema)
      .where(eq(userSchema.email, email))
      .limit(1)

    return Boolean(user)
  },

  async create(data: NewUser) {
    const [user] = await db.insert(userSchema).values(data).returning(publicUserColumns)

    return user
  },

  async findByGoogleId(googleId: string) {
    const [user] = await db
      .select()
      .from(userSchema)
      .where(eq(userSchema.googleId, googleId))
      .limit(1)

    return user
  },

  async linkGoogle(userId: string, googleId: string, clearCredentials: boolean) {
    const linked = db.$with('linked').as(
      db
        .update(userSchema)
        .set({
          googleId,
          emailVerifiedAt: sql`coalesce(${userSchema.emailVerifiedAt}, now())`,
          ...(clearCredentials && { passwordHash: null }),
        })
        .where(and(eq(userSchema.id, userId), isNull(userSchema.googleId)))
        .returning({ id: userSchema.id }),
    )

    const revoked = db.$with('revoked').as(
      db
        .update(sessionSchema)
        .set({ revokedAt: sql`now()` })
        .where(
          and(
            eq(sessionSchema.userId, userId),
            isNull(sessionSchema.revokedAt),
            sql`${clearCredentials}`,
            exists(db.select({ id: linked.id }).from(linked)),
          ),
        )
        .returning({ id: sessionSchema.id }),
    )

    const [, rows] = await db.batch([
      db
        .select({ id: userSchema.id })
        .from(userSchema)
        .where(eq(userSchema.id, userId))
        .for('no key update'),
      db.with(linked, revoked).select({ id: linked.id }).from(linked),
    ])

    return rows.length > 0
  },

  async createSession(data: NewSession & { id: string }, expectedPasswordHash: string | null) {
    const created = await db
      .insert(sessionSchema)
      .select(
        db
          .select({
            id: sql<string>`${data.id}::uuid`.as('id'),
            userId: userSchema.id,
            refreshTokenHash: sql<string>`${data.refreshTokenHash}::text`.as('refresh_token_hash'),
            expiresAt: sql<Date>`${data.expiresAt.toISOString()}::timestamptz`.as('expires_at'),
            userAgent: sql<string | null>`${data.userAgent ?? null}::varchar`.as('user_agent'),
          })
          .from(userSchema)
          .where(
            and(
              eq(userSchema.id, data.userId),
              sql`${userSchema.passwordHash} is not distinct from ${expectedPasswordHash}`,
            ),
          )
          .for('no key update'),
      )
      .returning({ id: sessionSchema.id })

    return created.length > 0
  },

  async findSessionById(id: string) {
    const [session] = await db.select().from(sessionSchema).where(eq(sessionSchema.id, id)).limit(1)

    return session
  },

  async rotateSessionToken(id: string, refreshTokenHash: string, expiresAt: Date) {
    await db
      .update(sessionSchema)
      .set({ refreshTokenHash, expiresAt })
      .where(and(eq(sessionSchema.id, id), isNull(sessionSchema.revokedAt)))
  },

  async revokeSession(id: string) {
    await db
      .update(sessionSchema)
      .set({ revokedAt: new Date() })
      .where(and(eq(sessionSchema.id, id), isNull(sessionSchema.revokedAt)))
  },

  async listActiveSessions(userId: string) {
    return db
      .select({
        id: sessionSchema.id,
        userAgent: sessionSchema.userAgent,
        createdAt: sessionSchema.createdAt,
        updatedAt: sessionSchema.updatedAt,
      })
      .from(sessionSchema)
      .where(
        and(
          eq(sessionSchema.userId, userId),
          isNull(sessionSchema.revokedAt),
          gt(sessionSchema.expiresAt, sql`now()`),
        ),
      )
      .orderBy(desc(sessionSchema.updatedAt))
  },

  async revokeUserSession(userId: string, id: string) {
    const revoked = await db
      .update(sessionSchema)
      .set({ revokedAt: sql`now()` })
      .where(
        and(
          eq(sessionSchema.id, id),
          eq(sessionSchema.userId, userId),
          isNull(sessionSchema.revokedAt),
          gt(sessionSchema.expiresAt, sql`now()`),
        ),
      )
      .returning({ id: sessionSchema.id })

    return revoked.length > 0
  },

  async revokeOtherSessions(userId: string, keepSessionId: string) {
    const revoked = await db
      .update(sessionSchema)
      .set({ revokedAt: sql`now()` })
      .where(
        and(
          eq(sessionSchema.userId, userId),
          isNull(sessionSchema.revokedAt),
          ne(sessionSchema.id, keepSessionId),
        ),
      )
      .returning({ id: sessionSchema.id })

    return revoked.length
  },

  async markEmailVerified(userId: string) {
    await db
      .update(userSchema)
      .set({ emailVerifiedAt: sql`now()` })
      .where(and(eq(userSchema.id, userId), isNull(userSchema.emailVerifiedAt)))
  },

  async resetPasswordAndRevokeSessions(userId: string, passwordHash: string) {
    await db.batch([
      db
        .update(userSchema)
        .set({
          passwordHash,
          emailVerifiedAt: sql`coalesce(${userSchema.emailVerifiedAt}, now())`,
        })
        .where(eq(userSchema.id, userId)),
      db
        .update(sessionSchema)
        .set({ revokedAt: sql`now()` })
        .where(and(eq(sessionSchema.userId, userId), isNull(sessionSchema.revokedAt))),
    ])
  },

  async updatePasswordRevokingOthers(
    userId: string,
    passwordHash: string,
    keepSessionId: string,
    expectedPasswordHash: string,
  ) {
    const [updated] = await db.batch([
      db
        .update(userSchema)
        .set({ passwordHash })
        .where(and(eq(userSchema.id, userId), eq(userSchema.passwordHash, expectedPasswordHash)))
        .returning({ id: userSchema.id }),
      db
        .update(sessionSchema)
        .set({ revokedAt: sql`now()` })
        .where(
          and(
            eq(sessionSchema.userId, userId),
            isNull(sessionSchema.revokedAt),
            ne(sessionSchema.id, keepSessionId),
            exists(
              db
                .select({ id: userSchema.id })
                .from(userSchema)
                .where(and(eq(userSchema.id, userId), eq(userSchema.passwordHash, passwordHash))),
            ),
          ),
        ),
    ])

    return updated.length > 0
  },

  async replaceToken(
    userId: string,
    type: AuthTokenType,
    token: NewAuthToken,
    cooldownSeconds?: number,
  ) {
    const saved = await db
      .insert(authTokenSchema)
      .values({ ...token, userId, type })
      .onConflictDoUpdate({
        target: [authTokenSchema.userId, authTokenSchema.type],
        set: { ...token, createdAt: sql`now()` },
        setWhere:
          cooldownSeconds === undefined
            ? undefined
            : sql`"auth_tokens"."created_at" < now() - make_interval(secs => ${cooldownSeconds})`,
      })
      .returning({ id: authTokenSchema.id })

    return saved.length > 0
  },

  async findToken(id: string, type: AuthTokenType) {
    const [token] = await db
      .select()
      .from(authTokenSchema)
      .where(and(eq(authTokenSchema.id, id), eq(authTokenSchema.type, type)))
      .limit(1)

    return token
  },

  async consumeToken(id: string, type: AuthTokenType) {
    const [token] = await db
      .delete(authTokenSchema)
      .where(
        and(
          eq(authTokenSchema.id, id),
          eq(authTokenSchema.type, type),
          gt(authTokenSchema.expiresAt, sql`now()`),
        ),
      )
      .returning({ userId: authTokenSchema.userId })

    return token?.userId
  },

  async findLatestTokenCreatedAt(userId: string, type: AuthTokenType) {
    const [token] = await db
      .select({ createdAt: authTokenSchema.createdAt })
      .from(authTokenSchema)
      .where(and(eq(authTokenSchema.userId, userId), eq(authTokenSchema.type, type)))
      .orderBy(desc(authTokenSchema.createdAt))
      .limit(1)

    return token?.createdAt
  },
}
