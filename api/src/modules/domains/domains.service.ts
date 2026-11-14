import { randomBytes } from 'node:crypto'
import { getUniqueViolation } from '../../shared/db-errors'
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ServiceUnavailableError,
} from '../../shared/errors'
import { isPro, PRO_PLAN_REQUIRED } from '../billing/billing.access'
import { billingRepository } from '../billing/billing.repository'
import { mailService } from '../mail/mail.service'
import { customDomainLiveMessage } from '../mail/mail.templates'
import { toInvalidateEntry } from '../pages/pages.cache'
import { pagesRepository } from '../pages/pages.repository'
import { publicPageCache } from '../pages/pages.service'
import { usersRepository } from '../users/users.repository'
import { type DomainOwner, resolveCache } from './domains.cache'
import { OWNERSHIP_PREFIX, ownershipDns, ownershipValue } from './domains.dns'
import type { DomainError, DomainRecord } from './domains.dto'
import {
  classifyHostname,
  isReservedHostname,
  normalizeHostname,
  relativeRecordName,
} from './domains.hostname'
import { type CustomDomain, domainsRepository } from './domains.repository'
import { type VercelProjectDomain, vercel } from './vercel.client'

const RECORDS_CACHE_MS = 60 * 60 * 1000

const PENDING_CHECK_MS = 5 * 60 * 1000

const ACTIVE_CHECK_MS = 24 * 60 * 60 * 1000

const CHECK_BATCH_SIZE = 20

interface RoutingTargets {
  at: number
  ipv4: string | null
  cname: string | null
  verification: VercelProjectDomain['verification']
}

const routingCache = new Map<string, RoutingTargets>()

function unavailable() {
  return new ServiceUnavailableError('Custom domains unavailable')
}

function remember(hostname: string, targets: Omit<RoutingTargets, 'at'>) {
  routingCache.set(hostname, { at: Date.now(), ...targets })
}

async function routingTargets(domain: CustomDomain) {
  const cached = routingCache.get(domain.hostname)

  if (cached && Date.now() - cached.at < RECORDS_CACHE_MS) return cached

  try {
    const config = await vercel.getDomainConfig(domain.hostname)

    remember(domain.hostname, {
      ipv4: config.recommendedIPv4[0] ?? null,
      cname: config.recommendedCNAME[0] ?? null,
      verification: cached?.verification ?? [],
    })

    return routingCache.get(domain.hostname)
  } catch {
    return cached
  }
}

function routingRecord(domain: CustomDomain, targets: RoutingTargets | undefined) {
  const name = relativeRecordName(domain.hostname, domain.hostname)

  if (domain.kind === 'apex' && targets?.ipv4) {
    return { type: 'A' as const, name, value: targets.ipv4, purpose: 'routing' as const }
  }

  if (domain.kind === 'subdomain' && targets?.cname) {
    return {
      type: 'CNAME' as const,
      name,
      value: targets.cname.replace(/\.+$/, ''),
      purpose: 'routing' as const,
    }
  }

  return null
}

async function buildRecords(domain: CustomDomain) {
  if (domain.status === 'active') return []

  const targets = await routingTargets(domain)

  const records: DomainRecord[] = []

  if (domain.status === 'pending_owner') {
    records.push({
      type: 'TXT',
      name: relativeRecordName(`${OWNERSHIP_PREFIX}.${domain.hostname}`, domain.hostname),
      value: ownershipValue(domain.verificationToken),
      purpose: 'ownership',
    })
  }

  const routing = routingRecord(domain, targets)

  if (routing) records.push(routing)

  for (const item of targets?.verification ?? []) {
    records.push({
      type: 'TXT',
      name: relativeRecordName(item.domain, domain.hostname),
      value: item.value,
      purpose: 'verification',
    })
  }

  return records
}

async function toView(domain: CustomDomain) {
  return {
    hostname: domain.hostname,
    kind: domain.kind,
    status: domain.status,
    lastError: domain.lastError as DomainError | null,
    records: await buildRecords(domain),
    checkedAt: domain.lastCheckedAt,
  }
}

async function invalidateDomain(domain: CustomDomain) {
  await resolveCache.invalidate(domain.hostname)

  const page = await pagesRepository.findByUserId(domain.userId)

  if (page) await publicPageCache.invalidate([toInvalidateEntry(page)])
}

function vercelNames(domain: CustomDomain) {
  return domain.kind === 'apex' ? [domain.hostname, `www.${domain.hostname}`] : [domain.hostname]
}

async function addToVercel(domain: CustomDomain) {
  const added = await vercel.addProjectDomain(domain.hostname)

  if (added.status === 'in_use_elsewhere') return null

  if (domain.kind === 'apex')
    await vercel.addProjectDomain(`www.${domain.hostname}`, domain.hostname)

  return added
}

async function fail(domain: CustomDomain, lastError: DomainError, now: Date) {
  return domainsRepository.update(domain.id, {
    status: lastError === 'in_use_elsewhere' ? 'error' : domain.status,
    lastError,
    lastCheckedAt: now,
  })
}

async function confirmOwnership(domain: CustomDomain, now: Date) {
  if (domain.ownerVerifiedAt) return domain

  if (!(await ownershipDns.hasToken(domain.hostname, domain.verificationToken))) return 'missing'

  try {
    return await domainsRepository.update(domain.id, {
      status: 'pending_dns',
      ownerVerifiedAt: now,
    })
  } catch (error) {
    if (getUniqueViolation(error)) return 'taken'

    throw error
  }
}

async function notifyLive(domain: CustomDomain) {
  const user = await usersRepository.findById(domain.userId)

  if (user) {
    void mailService.sendSafely({
      to: user.email,
      ...customDomainLiveMessage(user.name, domain.hostname),
    })
  }
}

async function syncWithVercel(domain: CustomDomain, now: Date) {
  const project = (await vercel.getProjectDomain(domain.hostname)) ?? (await addToVercel(domain))

  if (!project) return fail(domain, 'in_use_elsewhere', now)

  const verified =
    project.verified ||
    (project.verification.length > 0 && (await vercel.verifyProjectDomain(domain.hostname)))

  const config = await vercel.getDomainConfig(domain.hostname)

  remember(domain.hostname, {
    ipv4: config.recommendedIPv4[0] ?? null,
    cname: config.recommendedCNAME[0] ?? null,
    verification: verified ? [] : project.verification,
  })

  if (verified && !config.misconfigured) {
    const { domain: active, firstActivation } = await domainsRepository.activate(domain.id, now)

    if (domain.status !== 'active') await invalidateDomain(domain)

    if (firstActivation && active) await notifyLive(active)

    return active
  }

  const pending = await domainsRepository.update(domain.id, {
    status: 'pending_dns',
    lastError: 'dns_misconfigured',
    lastCheckedAt: now,
  })

  if (domain.status === 'active') await invalidateDomain(domain)

  return pending
}

async function checkDomain(domain: CustomDomain, now = new Date()) {
  const owned = await confirmOwnership(domain, now)

  if (owned === 'taken') return fail(domain, 'in_use_elsewhere', now)

  if (owned === 'missing' || !owned) {
    return domainsRepository.update(domain.id, {
      status: 'pending_owner',
      lastError: 'txt_missing',
      lastCheckedAt: now,
    })
  }

  try {
    return await syncWithVercel(owned, now)
  } catch (error) {
    if (!(error instanceof ServiceUnavailableError)) throw error

    return fail(owned, 'vercel_failed', now)
  }
}

async function removeFromVercel(domain: CustomDomain) {
  if (!domain.ownerVerifiedAt) return

  await Promise.all(vercelNames(domain).map((name) => vercel.removeProjectDomain(name)))
}

async function findOwner(hostname: string): Promise<DomainOwner | null> {
  const cached = await resolveCache.read(hostname)

  if (cached !== undefined) return cached

  const owner = (await domainsRepository.findActiveOwner(hostname)) ?? null

  await resolveCache.write(hostname, owner)

  return owner
}

async function requireDomain(userId: string) {
  const domain = await domainsRepository.findByUserId(userId)

  if (!domain) throw new NotFoundError('Domain not found')

  return domain
}

export const domainsService = {
  checkDomain,

  async checkDue(now = new Date()) {
    if (!vercel.isConfigured()) return 0

    const due = await domainsRepository.findDue(
      new Date(now.getTime() - PENDING_CHECK_MS),
      new Date(now.getTime() - ACTIVE_CHECK_MS),
      CHECK_BATCH_SIZE,
    )

    for (const domain of due) {
      await checkDomain(domain, now).catch(() => {
        console.error('Failed to check custom domain', domain.hostname)
      })
    }

    return due.length
  },

  async resolve(host: string) {
    const hostname = normalizeHostname(host)

    const owner = hostname && (await findOwner(hostname))

    if (!owner) throw new NotFoundError('Domain not found')

    return {
      username: owner.username,
      pro: isPro(await billingRepository.findByUserId(owner.userId)),
    }
  },

  resetRoutingCache() {
    routingCache.clear()
  },

  async getMine(userId: string) {
    const domain = await domainsRepository.findByUserId(userId)

    return domain ? toView(domain) : null
  },

  async connect(userId: string, input: string) {
    if (!vercel.isConfigured()) throw unavailable()

    const hostname = normalizeHostname(input)

    if (!hostname || isReservedHostname(hostname)) throw new BadRequestError('Invalid domain')

    if (!isPro(await billingRepository.findByUserId(userId))) {
      throw new ForbiddenError(PRO_PLAN_REQUIRED)
    }

    if (!(await pagesRepository.findByUserId(userId))) throw new NotFoundError('Page not found')

    if (await domainsRepository.findByUserId(userId)) {
      throw new ConflictError('Domain already connected')
    }

    if (await domainsRepository.findVerifiedByHostname(hostname)) {
      throw new ConflictError('Domain already in use')
    }

    try {
      const domain = await domainsRepository.create({
        userId,
        hostname,
        kind: classifyHostname(hostname),
        verificationToken: randomBytes(24).toString('base64url'),
      })

      if (!domain) throw unavailable()

      return toView(domain)
    } catch (error) {
      const constraint = getUniqueViolation(error)

      if (constraint) throw new ConflictError('Domain already connected')

      throw error
    }
  },

  async check(userId: string) {
    if (!vercel.isConfigured()) throw unavailable()

    const domain = await requireDomain(userId)

    const checked = await checkDomain(domain)

    return toView(checked ?? domain)
  },

  async remove(userId: string) {
    const domain = await requireDomain(userId)

    if (domain.ownerVerifiedAt && !vercel.isConfigured()) throw unavailable()

    await removeFromVercel(domain)

    await domainsRepository.deleteByUserId(userId)

    await invalidateDomain(domain)
  },

  async removeBeforeAccountDeletion(userId: string) {
    const domain = await domainsRepository.findByUserId(userId)

    if (!domain || !vercel.isConfigured()) return

    try {
      await removeFromVercel(domain)
    } catch {
      console.error('Failed to remove custom domain from Vercel', domain.hostname)
    }
  },
}
