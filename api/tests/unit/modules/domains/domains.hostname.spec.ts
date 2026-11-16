import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { env } from '../../../../src/config/env'
import {
  classifyHostname,
  isReservedHostname,
  normalizeHostname,
} from '../../../../src/modules/domains/domains.hostname'

describe('domain hostname', () => {
  const original = env.PLATFORM_HOSTS

  beforeEach(() => {
    env.PLATFORM_HOSTS = ['lynko.app', 'www.lynko.app']
  })

  afterEach(() => {
    env.PLATFORM_HOSTS = original
  })

  it('normalizes protocol, case, www, path, port and trailing dot', () => {
    expect(normalizeHostname('https://WWW.SeuNome.com/')).toBe('seunome.com')

    expect(normalizeHostname('  links.seunome.com:8080/x?y=1 ')).toBe('links.seunome.com')

    expect(normalizeHostname('seunome.com.br.')).toBe('seunome.com.br')
  })

  it('rejects input that is not a hostname', () => {
    expect(normalizeHostname('')).toBeNull()

    expect(normalizeHostname('ex ample.com')).toBeNull()

    expect(normalizeHostname('café.com')).toBeNull()

    expect(normalizeHostname('-bad.com')).toBeNull()

    expect(normalizeHostname(`${'a'.repeat(250)}.com`)).toBeNull()
  })

  it('classifies apex and subdomain with the public suffix list', () => {
    expect(classifyHostname('seunome.com')).toBe('apex')

    expect(classifyHostname('seunome.com.br')).toBe('apex')

    expect(classifyHostname('links.seunome.com')).toBe('subdomain')

    expect(classifyHostname('a.b.seunome.com.br')).toBe('subdomain')
  })

  it('accepts regular domains', () => {
    expect(isReservedHostname('seunome.com')).toBe(false)

    expect(isReservedHostname('links.seunome.com.br')).toBe(false)
  })

  it('refuses ips, localhost, vercel, public suffixes and platform hosts', () => {
    for (const host of [
      '127.0.0.1',
      '::1',
      'localhost',
      'app.localhost',
      'x.vercel.app',
      'com.br',
      'seunome.invalidtld',
      'lynko.app',
      'joao.lynko.app',
    ]) {
      expect(isReservedHostname(host)).toBe(true)
    }
  })
})
