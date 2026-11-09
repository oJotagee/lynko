import { neon } from '@neondatabase/serverless'

import { env } from '../config/env'

if (env.NODE_ENV === 'production') {
  throw new Error('db:reset is blocked when NODE_ENV is production')
}

const sql = neon(env.DATABASE_URL)

await sql.query('DROP SCHEMA IF EXISTS drizzle CASCADE')

await sql.query('DROP SCHEMA IF EXISTS public CASCADE')

await sql.query('CREATE SCHEMA public')
