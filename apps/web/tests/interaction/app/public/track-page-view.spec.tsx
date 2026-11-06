import { afterEach, beforeEach, describe, expect, it, spyOn } from 'bun:test'
import { render } from '@testing-library/react'
import { StrictMode } from 'react'

import { TrackPageView } from '@/app/[locale]/(public)/[username]/_components/track-page-view'

const pageId = '7f0c9e64-3f1d-4c2b-9a51-2d8e6f4b1a90'

describe('TrackPageView', () => {
  let fetchSpy: ReturnType<typeof spyOn<typeof globalThis, 'fetch'>>

  beforeEach(() => {
    fetchSpy = spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 202 }))
  })

  afterEach(() => {
    fetchSpy.mockRestore()
  })

  it('sends one view with a uuid eventId and keepalive', () => {
    render(<TrackPageView pageId={pageId} />)

    expect(fetchSpy).toHaveBeenCalledTimes(1)

    const [url, init] = fetchSpy.mock.calls[0] ?? []

    expect(String(url)).toEndWith('/analytics/views')
    expect(init?.method).toBe('POST')
    expect(init?.keepalive).toBe(true)

    const body = JSON.parse(String(init?.body))

    expect(body.pageId).toBe(pageId)
    expect(body.eventId).toMatch(/^[0-9a-f-]{36}$/)
  })

  it('sends once even with a re-render and a double mount', () => {
    const { rerender } = render(
      <StrictMode>
        <TrackPageView pageId={pageId} />
      </StrictMode>,
    )

    rerender(
      <StrictMode>
        <TrackPageView pageId={pageId} />
      </StrictMode>,
    )

    expect(fetchSpy).toHaveBeenCalledTimes(1)
  })

  it('does not break when the network fails', async () => {
    fetchSpy.mockRejectedValue(new Error('offline'))

    expect(() => render(<TrackPageView pageId={pageId} />)).not.toThrow()

    await Promise.resolve()
  })

  it('renders nothing', () => {
    const { container } = render(<TrackPageView pageId={pageId} />)

    expect(container).toBeEmptyDOMElement()
  })
})
