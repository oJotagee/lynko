import { describe, expect, it } from 'bun:test'

import {
  getLinkStatus,
  getScheduleText,
} from '@/app/[locale]/(panel)/dashboard/_components/link-status'

const now = new Date('2026-11-14T12:00:00.000Z')

const before = '2026-11-14T11:00:00.000Z'

const after = '2026-11-14T13:00:00.000Z'

function link(startsAt: string | null, endsAt: string | null, active = true) {
  return { active, startsAt, endsAt }
}

describe('getLinkStatus', () => {
  it.each([
    ['live without dates', link(null, null), 'live'],
    ['hidden even inside the window', link(before, after, false), 'hidden'],
    ['scheduled before the start', link(after, null), 'scheduled'],
    ['live exactly at the start', link(now.toISOString(), null), 'live'],
    ['live inside the window', link(before, after), 'live'],
    ['ended exactly at the end', link(null, now.toISOString()), 'ended'],
    ['ended after the end', link(null, before), 'ended'],
  ] as const)('%s', (_label, value, expected) => {
    expect(getLinkStatus(value, now)).toBe(expected)
  })
})

describe('getScheduleText', () => {
  it('describes the start and the end of a scheduled link', () => {
    expect(getScheduleText(link(after, after), 'scheduled')).toMatch(/^Entra no ar em .+ e sai em /)
  })

  it('describes when a live link leaves', () => {
    expect(getScheduleText(link(null, after), 'live')).toMatch(/^Sai do ar em /)
  })

  it('describes when an ended link left', () => {
    expect(getScheduleText(link(null, before), 'ended')).toMatch(/^Saiu do ar em /)
  })

  it('has nothing to say about a link without dates or a hidden one', () => {
    expect(getScheduleText(link(null, null), 'live')).toBeNull()

    expect(getScheduleText(link(before, after), 'hidden')).toBeNull()
  })
})
