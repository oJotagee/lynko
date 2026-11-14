import { z } from 'zod'
import { env } from '../../config/env'
import { ServiceUnavailableError } from '../../shared/errors'

const BASE_URL = 'https://api.vercel.com'

const TIMEOUT_MS = 10_000

const verificationRecord = z.object({
  type: z.string(),
  domain: z.string(),
  value: z.string(),
})

const projectDomain = z.object({
  name: z.string(),
  verified: z.boolean(),
  verification: z.array(verificationRecord).optional().default([]),
})

const domainConfig = z.object({
  misconfigured: z.boolean(),
  recommendedIPv4: z
    .array(z.object({ rank: z.number(), value: z.array(z.string()) }))
    .optional()
    .default([]),
  recommendedCNAME: z
    .array(z.object({ rank: z.number(), value: z.string() }))
    .optional()
    .default([]),
})

export type VercelProjectDomain = z.infer<typeof projectDomain>

export type AddProjectDomainResult =
  | ({ status: 'added' } & VercelProjectDomain)
  | { status: 'in_use_elsewhere' }

export interface VercelDomainConfig {
  misconfigured: boolean
  recommendedIPv4: string[]
  recommendedCNAME: string[]
}

function unavailable() {
  return new ServiceUnavailableError('Custom domains unavailable')
}

function projectPath(suffix = '') {
  return `/projects/${encodeURIComponent(env.VERCEL_PROJECT_ID ?? '')}/domains${suffix}`
}

function domainPath(name: string, suffix = '') {
  return projectPath(`/${encodeURIComponent(name)}${suffix}`)
}

function buildUrl(path: string, query: Record<string, string> = {}) {
  const url = new URL(`${BASE_URL}${path}`)

  if (env.VERCEL_TEAM_ID) url.searchParams.set('teamId', env.VERCEL_TEAM_ID)

  for (const [key, value] of Object.entries(query)) url.searchParams.set(key, value)

  return url
}

async function send(path: string, init: RequestInit = {}, query: Record<string, string> = {}) {
  if (!vercel.isConfigured()) throw unavailable()

  try {
    return await fetch(buildUrl(path, query), {
      ...init,
      headers: {
        authorization: `Bearer ${env.VERCEL_API_TOKEN}`,
        'content-type': 'application/json',
      },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
  } catch {
    throw unavailable()
  }
}

async function read<T>(response: Response, path: string, schema: z.ZodType<T>) {
  const body = await response.json().catch(() => null)

  const parsed = schema.safeParse(body)

  if (!response.ok || !parsed.success) {
    console.error('Vercel request failed', path, response.status)

    throw unavailable()
  }

  return parsed.data
}

export const vercel = {
  isConfigured() {
    return Boolean(env.VERCEL_API_TOKEN && env.VERCEL_PROJECT_ID)
  },

  async addProjectDomain(name: string, redirect?: string): Promise<AddProjectDomainResult> {
    const path = `/v10${projectPath()}`

    const payload = redirect ? { name, redirect, redirectStatusCode: 308 } : { name }

    const response = await send(path, { method: 'POST', body: JSON.stringify(payload) })

    if (response.status === 409) {
      const existing = await vercel.getProjectDomain(name)

      return existing ? { status: 'added', ...existing } : { status: 'in_use_elsewhere' }
    }

    return { status: 'added', ...(await read(response, path, projectDomain)) }
  },

  async getProjectDomain(name: string) {
    const path = `/v9${domainPath(name)}`

    const response = await send(path)

    if (response.status === 404) return null

    return read(response, path, projectDomain)
  },

  async verifyProjectDomain(name: string) {
    const path = `/v9${domainPath(name, '/verify')}`

    const response = await send(path, { method: 'POST' })

    if (response.status === 400) return false

    return (await read(response, path, projectDomain)).verified
  },

  async getDomainConfig(name: string): Promise<VercelDomainConfig> {
    const path = `/v6/domains/${encodeURIComponent(name)}/config`

    const response = await send(path, {}, { projectIdOrName: env.VERCEL_PROJECT_ID ?? '' })

    const config = await read(response, path, domainConfig)

    const byRank = <T extends { rank: number }>(items: T[]) =>
      [...items].sort((a, b) => a.rank - b.rank)

    return {
      misconfigured: config.misconfigured,
      recommendedIPv4: byRank(config.recommendedIPv4).flatMap((item) => item.value),
      recommendedCNAME: byRank(config.recommendedCNAME).map((item) => item.value),
    }
  },

  async removeProjectDomain(name: string) {
    const path = `/v9${domainPath(name)}`

    const response = await send(path, { method: 'DELETE' })

    if (response.ok || response.status === 404) return

    console.error('Vercel request failed', path, response.status)

    throw unavailable()
  },
}
