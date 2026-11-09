import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'bun:test'
import { randomUUID } from 'node:crypto'
import { neon, neonConfig, Pool, type PoolClient } from '@neondatabase/serverless'

const proxy = process.env.NEON_PROXY_TEST_URL ?? ''

const connection = 'postgres://postgres:postgres@db.localtest.me:5432/lynko_test'

const sql = neon(connection)

const LOCALHOSTS = ['localhost', '127.0.0.1', '[::1]']

const future = () => new Date(Date.now() + 60 * 60 * 1000)

function wait(ms: number) {
  return new Promise<void>((done) => setTimeout(done, ms))
}

async function rows(text: string, params: unknown[] = []) {
  return (await sql.query(text, params)) as Record<string, unknown>[]
}

async function assertDisposableDatabase() {
  if (!LOCALHOSTS.includes(new URL(proxy).hostname)) {
    throw new Error('NEON_PROXY_TEST_URL must point to localhost')
  }

  const [target] = await rows(
    "select current_database() as name, current_setting('lynko.disposable', true) as disposable",
  )

  if (target?.name !== 'lynko_test' || target?.disposable !== 'yes') {
    throw new Error(
      'Refusing to run: the database behind the proxy is not the disposable lynko_test (docker compose --profile db-test)',
    )
  }
}

async function createSchema() {
  const schema = await import('../../src/db/schema')

  const api = await import('drizzle-kit/api-postgres')

  const statements = await api.generateMigration(
    await api.generateDrizzleJson({}),
    await api.generateDrizzleJson(schema as never),
  )

  await sql.query('drop schema if exists public cascade')

  await sql.query('create schema public')

  for (const statement of statements) await sql.query(statement)
}

async function waitForLockWait() {
  const deadline = Date.now() + 5_000

  while (Date.now() < deadline) {
    const waiting = await rows(
      "select 1 from pg_stat_activity where datname = current_database() and wait_event_type = 'Lock' and pid <> pg_backend_pid()",
    )

    if (waiting.length > 0) return

    await wait(50)
  }

  throw new Error('No query is waiting on a lock')
}

async function activeSessions(userId: string) {
  return (await rows('select id from sessions where user_id = $1 and revoked_at is null', [userId]))
    .length
}

async function createUser(passwordHash: string | null = 'hash-old') {
  const [user] = await rows(
    'insert into users (name, email, password_hash) values ($1, $2, $3) returning id',
    ['Maria', `${randomUUID()}@example.com`, passwordHash],
  )

  return user?.id as string
}

async function createPage(userId: string) {
  const [page] = await rows(
    "insert into pages (user_id, username, title, theme) values ($1, $2, 'Maria', '{}'::jsonb) returning id",
    [userId, `u${randomUUID().replaceAll('-', '').slice(0, 20)}`],
  )

  return page?.id as string
}

describe.skipIf(!proxy)('account locks on a real Postgres', () => {
  let pool: Pool

  let holder: PoolClient

  let authRepository: typeof import('../../src/modules/auth/auth.repository').authRepository

  let usersRepository: typeof import('../../src/modules/users/users.repository').usersRepository

  const pending: Promise<unknown>[] = []

  const originalDatabaseUrl = process.env.DATABASE_URL

  const originalNeon = {
    fetchEndpoint: neonConfig.fetchEndpoint,
    useSecureWebSocket: neonConfig.useSecureWebSocket,
    pipelineTLS: neonConfig.pipelineTLS,
    pipelineConnect: neonConfig.pipelineConnect,
    wsProxy: neonConfig.wsProxy,
  }

  function track<T>(promise: Promise<T>) {
    const state = { done: false }

    pending.push(promise)

    promise
      .finally(() => {
        state.done = true
      })
      .catch(() => undefined)

    return state
  }

  beforeAll(async () => {
    neonConfig.fetchEndpoint = `${proxy}/sql`

    neonConfig.useSecureWebSocket = false

    neonConfig.pipelineTLS = false

    neonConfig.pipelineConnect = false

    neonConfig.wsProxy = () => `${new URL(proxy).host}/v2`

    await assertDisposableDatabase()

    process.env.DATABASE_URL = connection

    await createSchema()

    pool = new Pool({ connectionString: connection })
    ;({ authRepository } = await import('../../src/modules/auth/auth.repository'))
    ;({ usersRepository } = await import('../../src/modules/users/users.repository'))
  }, 60_000)

  afterAll(async () => {
    await pool?.end()

    Object.assign(neonConfig, originalNeon)

    if (originalDatabaseUrl === undefined) delete process.env.DATABASE_URL
    else process.env.DATABASE_URL = originalDatabaseUrl
  })

  beforeEach(async () => {
    await sql.query(
      'truncate users, page_views_daily, link_clicks_daily, social_clicks_daily restart identity cascade',
    )

    holder = await pool.connect()
  }, 15_000)

  afterEach(async () => {
    await holder.query('rollback').catch(() => undefined)

    holder.release()

    await Promise.allSettled(pending.splice(0))
  })

  async function holdLoginLock(userId: string, hash: string) {
    await holder.query('begin')

    await holder.query(
      `insert into sessions (id, user_id, refresh_token_hash, expires_at)
       select $1::uuid, id, 'held', now() + interval '1 hour' from users
       where id = $2 and password_hash is not distinct from $3 for no key update`,
      [randomUUID(), userId, hash],
    )
  }

  it('login waits for an uncommitted password change and is then refused', async () => {
    const userId = await createUser()

    await holder.query('begin')

    await holder.query("update users set password_hash = 'hash-new' where id = $1", [userId])

    const login = authRepository.createSession(
      { id: randomUUID(), userId, refreshTokenHash: 'h', expiresAt: future() },
      'hash-old',
    )

    const state = track(login)

    await waitForLockWait()

    expect(state.done).toBe(false)

    await holder.query('commit')

    expect(await login).toBe(false)

    expect(await activeSessions(userId)).toBe(0)
  })

  it('a password reset waits for a login in flight and then revokes its session', async () => {
    const userId = await createUser()

    await holdLoginLock(userId, 'hash-old')

    const reset = authRepository.resetPasswordAndRevokeSessions(userId, 'hash-new')

    const state = track(reset)

    await waitForLockWait()

    expect(state.done).toBe(false)

    await holder.query('commit')

    await reset

    expect(await activeSessions(userId)).toBe(0)
  })

  it('a Google link waits for a login in flight and then revokes its session', async () => {
    const userId = await createUser()

    await holdLoginLock(userId, 'hash-old')

    const link = authRepository.linkGoogle(userId, 'google-1', true)

    const state = track(link)

    await waitForLockWait()

    expect(state.done).toBe(false)

    await holder.query('commit')

    expect(await link).toBe(true)

    expect(await activeSessions(userId)).toBe(0)

    const [user] = await rows('select password_hash, google_id from users where id = $1', [userId])

    expect(user).toEqual({ password_hash: null, google_id: 'google-1' })
  })

  it('a losing Google link changes nothing and keeps the winning session', async () => {
    const userId = await createUser()

    expect(await authRepository.linkGoogle(userId, 'google-1', true)).toBe(true)

    await sql.query(
      "insert into sessions (user_id, refresh_token_hash, expires_at) values ($1, 'winner', now() + interval '1 hour')",
      [userId],
    )

    expect(await authRepository.linkGoogle(userId, 'google-1', true)).toBe(false)

    expect(await activeSessions(userId)).toBe(1)
  })

  it('an account deletion collects media that is committed while it waits', async () => {
    const userId = await createUser()

    const pageId = await createPage(userId)

    await holder.query('begin')

    await holder.query(
      "insert into media (page_id, key, type, mime_type, size) values ($1, 'late-key', 'avatar', 'image/png', 1)",
      [pageId],
    )

    const deletion = usersRepository.deleteWithData(userId, 'hash-old')

    const state = track(deletion)

    await waitForLockWait()

    expect(state.done).toBe(false)

    await holder.query('commit')

    const result = await deletion

    expect(result?.mediaKeys).toEqual(['late-key'])

    expect(await rows('select id from users where id = $1', [userId])).toHaveLength(0)
  })

  it('an account deletion also collects a page created while it waits', async () => {
    const userId = await createUser()

    await holder.query('begin')

    await holder.query(
      "insert into pages (user_id, username, title, theme) values ($1, 'lateuser', 'Maria', '{}'::jsonb)",
      [userId],
    )

    const deletion = usersRepository.deleteWithData(userId, 'hash-old')

    const state = track(deletion)

    await waitForLockWait()

    expect(state.done).toBe(false)

    await holder.query('commit')

    const result = await deletion

    expect(result?.page?.username).toBe('lateuser')

    expect(await rows('select id from pages')).toHaveLength(0)
  })

  it('an account deletion with a stale credential deletes nothing', async () => {
    const userId = await createUser('hash-current')

    const pageId = await createPage(userId)

    await sql.query(
      "insert into media (page_id, key, type, mime_type, size) values ($1, 'kept-key', 'avatar', 'image/png', 1)",
      [pageId],
    )

    expect(await usersRepository.deleteWithData(userId, 'hash-stale')).toBeUndefined()

    expect(await rows('select id from users where id = $1', [userId])).toHaveLength(1)

    expect(await rows('select id from media')).toHaveLength(1)
  })

  it('a Google-only account (null hash) can be deleted', async () => {
    const userId = await createUser(null)

    expect(await usersRepository.deleteWithData(userId, null)).toBeDefined()

    expect(await rows('select id from users where id = $1', [userId])).toHaveLength(0)
  })

  it('a token is replaced only after its cooldown and is consumed once', async () => {
    const userId = await createUser()

    const first = { id: randomUUID(), tokenHash: 'one', expiresAt: future() }

    expect(await authRepository.replaceToken(userId, 'password_reset', first, 60)).toBe(true)

    const second = { id: randomUUID(), tokenHash: 'two', expiresAt: future() }

    expect(await authRepository.replaceToken(userId, 'password_reset', second, 60)).toBe(false)

    expect(await authRepository.findToken(first.id, 'password_reset')).toBeDefined()

    await sql.query("update auth_tokens set created_at = now() - interval '2 minutes'")

    expect(await authRepository.replaceToken(userId, 'password_reset', second, 60)).toBe(true)

    expect(await authRepository.findToken(first.id, 'password_reset')).toBeUndefined()

    expect(await authRepository.consumeToken(second.id, 'password_reset')).toBe(userId)

    expect(await authRepository.consumeToken(second.id, 'password_reset')).toBeUndefined()
  })
})
