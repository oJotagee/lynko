const USER_AGENT_MAX_LENGTH = 255

const browsers: [RegExp, string][] = [
  [/edg(e|a|ios)?\//i, 'Edge'],
  [/opr\/|opera/i, 'Opera'],
  [/firefox\/|fxios\//i, 'Firefox'],
  [/chrome\/|crios\//i, 'Chrome'],
  [/safari\//i, 'Safari'],
]

const systems: [RegExp, string][] = [
  [/windows/i, 'Windows'],
  [/iphone|ipad|ipod/i, 'iOS'],
  [/android/i, 'Android'],
  [/mac os x|macintosh/i, 'macOS'],
  [/linux/i, 'Linux'],
]

function match(userAgent: string, patterns: [RegExp, string][]) {
  return patterns.find(([pattern]) => pattern.test(userAgent))?.[1] ?? null
}

export function normalizeUserAgent(value: unknown) {
  if (typeof value !== 'string') return null

  const trimmed = value.trim()

  return trimmed ? trimmed.slice(0, USER_AGENT_MAX_LENGTH) : null
}

export function parseUserAgent(userAgent: string | null) {
  if (!userAgent) return { browser: null, os: null }

  return { browser: match(userAgent, browsers), os: match(userAgent, systems) }
}
