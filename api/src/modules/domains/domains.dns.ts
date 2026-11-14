import { Resolver } from 'node:dns/promises'

export const OWNERSHIP_PREFIX = '_lynko'

export function ownershipValue(token: string) {
  return `lynko-verify=${token}`
}

export const ownershipDns = {
  async hasToken(hostname: string, token: string) {
    const resolver = new Resolver({ timeout: 3000, tries: 2 })

    try {
      const records = await resolver.resolveTxt(`${OWNERSHIP_PREFIX}.${hostname}`)

      return records.some((chunks) => chunks.join('') === ownershipValue(token))
    } catch {
      return false
    }
  },
}
