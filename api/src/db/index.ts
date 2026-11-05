import { neon } from '@neondatabase/serverless'
import { defineRelations } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/neon-http'

import { env } from '../config/env'
import * as schema from './schema'

const relations = defineRelations(schema)

const sql = neon(env.DATABASE_URL)

export const db = drizzle({ client: sql, relations })
