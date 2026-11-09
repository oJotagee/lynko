import { describe, expect, test } from 'bun:test'

import en from '@/messages/en.json'
import pt from '@/messages/pt.json'

function keysOf(value: unknown, prefix = ''): string[] {
  if (typeof value !== 'object' || value === null) return [prefix]

  return Object.entries(value).flatMap(([key, child]) =>
    keysOf(child, prefix ? `${prefix}.${key}` : key),
  )
}

describe('messages', () => {
  const enKeys = new Set(keysOf(en))

  const ptKeys = new Set(keysOf(pt))

  test('every Portuguese key exists in English', () => {
    expect([...ptKeys].filter((key) => !enKeys.has(key))).toEqual([])
  })

  test('every English key exists in Portuguese', () => {
    expect([...enKeys].filter((key) => !ptKeys.has(key))).toEqual([])
  })
})
