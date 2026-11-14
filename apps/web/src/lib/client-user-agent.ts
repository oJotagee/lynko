import { headers } from 'next/headers'

export async function getClientUserAgentHeader(): Promise<Record<string, string>> {
  try {
    const userAgent = (await headers()).get('user-agent')

    return userAgent ? { 'x-client-user-agent': userAgent.slice(0, 255) } : {}
  } catch {
    return {}
  }
}
