import { parse } from 'tldts'
import { env } from '../../config/env'

export type HostnameKind = 'apex' | 'subdomain'

const MAX_LENGTH = 253

const LABEL = /^(?!-)[a-z0-9-]{1,63}(?<!-)$/

const RESERVED_SUFFIXES = ['vercel.app', 'localhost']

function isValidLabels(host: string) {
  return host.split('.').every((label) => LABEL.test(label))
}

function isSameOrSubdomain(host: string, base: string) {
  return host === base || host.endsWith(`.${base}`)
}

export function normalizeHostname(input: string) {
  const { hostname } = parse(input.trim().toLowerCase())

  if (!hostname) return null

  const host = hostname.replace(/\.+$/, '').replace(/^www\./, '')

  if (host.length === 0 || host.length > MAX_LENGTH || !isValidLabels(host)) return null

  return host
}

export function classifyHostname(host: string): HostnameKind {
  return parse(host).subdomain ? 'subdomain' : 'apex'
}

export function relativeRecordName(fqdn: string, host: string) {
  const zone = parse(host).domain

  const name = fqdn.replace(/\.+$/, '').toLowerCase()

  if (!zone || name === zone) return '@'

  return name.endsWith(`.${zone}`) ? name.slice(0, -(zone.length + 1)) : name
}

export function isReservedHostname(host: string) {
  const parsed = parse(host)

  if (parsed.isIp || !parsed.isIcann || !parsed.domain) return true

  if (host.length > MAX_LENGTH) return true

  const platformHosts = env.PLATFORM_HOSTS.map((platformHost) => platformHost.replace(/^www\./, ''))

  return [...RESERVED_SUFFIXES, ...platformHosts].some((base) => isSameOrSubdomain(host, base))
}
