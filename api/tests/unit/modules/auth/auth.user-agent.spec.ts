import { describe, expect, it } from 'bun:test'
import { normalizeUserAgent, parseUserAgent } from '../../../../src/modules/auth/auth.user-agent'

const agents = {
  chromeWindows:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  edgeWindows:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0',
  safariIphone:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1',
  chromeIphone:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/131.0.6778.73 Mobile/15E148 Safari/604.1',
  firefoxMac: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14.7; rv:132.0) Gecko/20100101 Firefox/132.0',
  chromeAndroid:
    'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36',
  operaLinux:
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 OPR/115.0.0.0',
}

describe('parseUserAgent', () => {
  it.each([
    [agents.chromeWindows, 'Chrome', 'Windows'],
    [agents.edgeWindows, 'Edge', 'Windows'],
    [agents.safariIphone, 'Safari', 'iOS'],
    [agents.chromeIphone, 'Chrome', 'iOS'],
    [agents.firefoxMac, 'Firefox', 'macOS'],
    [agents.chromeAndroid, 'Chrome', 'Android'],
    [agents.operaLinux, 'Opera', 'Linux'],
  ])('reads %s', (userAgent, browser, os) => {
    expect(parseUserAgent(userAgent)).toEqual({ browser, os })
  })

  it('returns nulls for an unknown or missing user agent', () => {
    expect(parseUserAgent('curl/8.4.0')).toEqual({ browser: null, os: null })

    expect(parseUserAgent(null)).toEqual({ browser: null, os: null })
  })
})

describe('normalizeUserAgent', () => {
  it('trims, cuts at 255 and ignores empty or non string values', () => {
    expect(normalizeUserAgent('  Chrome  ')).toBe('Chrome')

    expect(normalizeUserAgent('a'.repeat(300))).toHaveLength(255)

    expect(normalizeUserAgent('   ')).toBeNull()

    expect(normalizeUserAgent(undefined)).toBeNull()

    expect(normalizeUserAgent(['a', 'b'])).toBeNull()
  })
})
