import { z } from 'zod'

export const domainStatus = z.enum(['pending_owner', 'pending_dns', 'active', 'error'])

export const domainError = z.enum([
  'txt_missing',
  'dns_misconfigured',
  'in_use_elsewhere',
  'vercel_failed',
])

export const domainRecord = z.object({
  type: z.enum(['A', 'CNAME', 'TXT']),
  name: z.string(),
  value: z.string(),
  purpose: z.enum(['ownership', 'routing', 'verification']),
})

export const domainResponse = z.object({
  hostname: z.string(),
  kind: z.enum(['apex', 'subdomain']),
  status: domainStatus,
  lastError: domainError.nullable(),
  records: z.array(domainRecord),
  checkedAt: z.date().nullable(),
})

export const myDomainResponse = domainResponse.nullable()

export const connectDomainBody = z.object({ hostname: z.string().trim().min(1).max(300) })

export const resolveQuery = z.object({ host: z.string().trim().min(1).max(300) })

export const resolveResponse = z.object({ username: z.string(), pro: z.boolean() })

export type DomainStatus = z.infer<typeof domainStatus>

export type DomainError = z.infer<typeof domainError>

export type DomainRecord = z.infer<typeof domainRecord>
