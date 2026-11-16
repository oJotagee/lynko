import { z } from 'zod'

import { API_URL } from './api'
import { SITE_URL } from './site'

const CACHE_MS = 60 * 1000

const MAX_CACHED_HOSTS = 1000

const TIMEOUT_MS = 3000

const domainOwner = z.object({ username: z.string().min(1).max(30), pro: z.boolean() })

export type DomainOwner = z.infer<typeof domainOwner>

const cache = new Map<string, { at: number; owner: DomainOwner | null }>()

function siteHost() {
  return new URL(SITE_URL).hostname
}

export function isPlatformHost(host: string) {
  const site = siteHost().replace(/^www\./, '')

  return (
    host === site ||
    host === `www.${site}` ||
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === '[::1]' ||
    host.endsWith('.localhost') ||
    host.endsWith('.vercel.app')
  )
}

function remember(host: string, owner: DomainOwner | null) {
  if (cache.size >= MAX_CACHED_HOSTS) cache.clear()

  cache.set(host, { at: Date.now(), owner })
}

export function clearCustomDomainCache() {
  cache.clear()
}

export async function resolveHost(host: string): Promise<DomainOwner | null | undefined> {
  const cached = cache.get(host)

  if (cached && Date.now() - cached.at < CACHE_MS) return cached.owner

  try {
    const response = await fetch(`${API_URL}/domains/resolve?host=${encodeURIComponent(host)}`, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: 'no-store',
    })

    if (response.status === 404) {
      remember(host, null)

      return null
    }

    if (!response.ok) return undefined

    const parsed = domainOwner.safeParse(await response.json())

    if (!parsed.success) return undefined

    const owner = parsed.data

    remember(host, owner)

    return owner
  } catch {
    return undefined
  }
}
