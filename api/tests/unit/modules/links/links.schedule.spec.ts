import { describe, expect, it } from 'bun:test'

import { isLinkLive, isValidSchedule } from '../../../../src/modules/links/links.schedule'

const now = new Date('2026-11-14T12:00:00.000Z')

const before = new Date('2026-11-14T11:00:00.000Z')

const after = new Date('2026-11-14T13:00:00.000Z')

function link(startsAt: Date | string | null, endsAt: Date | string | null, isActive = true) {
  return { isActive, startsAt, endsAt }
}

describe('isLinkLive', () => {
  it.each([
    ['without dates', link(null, null), true],
    ['after the start', link(before, null), true],
    ['exactly at the start', link(now, null), true],
    ['before the start', link(after, null), false],
    ['before the end', link(null, after), true],
    ['exactly at the end', link(null, now), false],
    ['after the end', link(null, before), false],
    ['inside the window', link(before, after), true],
    ['hidden even inside the window', link(before, after, false), false],
    ['with dates as JSON strings', link(before.toISOString(), after.toISOString()), true],
    ['with an ended JSON string', link(null, before.toISOString()), false],
  ])('%s', (_label, value, expected) => {
    expect(isLinkLive(value, now)).toBe(expected)
  })
})

describe('isValidSchedule', () => {
  it.each([
    [null, null, true],
    [before, null, true],
    [null, after, true],
    [before, after, true],
    [after, before, false],
    [now, now, false],
  ])('start %p and end %p is %p', (startsAt, endsAt, expected) => {
    expect(isValidSchedule(startsAt, endsAt)).toBe(expected)
  })
})
