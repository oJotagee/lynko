import { describe, expect, it } from 'bun:test'
import { renderHook, waitFor } from '@testing-library/react'

import { getLinkStatus } from '@/app/[locale]/(panel)/dashboard/_components/link-status'
import { useNow } from '@/hooks/use-now'

describe('useNow', () => {
  it('moves a scheduled link to live without a reload when its start arrives', async () => {
    const link = { active: true, startsAt: new Date(Date.now() + 80).toISOString(), endsAt: null }

    const { result } = renderHook(() => getLinkStatus(link, useNow(20) ?? new Date()))

    expect(result.current).toBe('scheduled')

    await waitFor(() => expect(result.current).toBe('live'))
  })

  it('stops the timer when unmounted', () => {
    const { unmount } = renderHook(() => useNow(20))

    expect(() => unmount()).not.toThrow()
  })
})
