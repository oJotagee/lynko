'use client'

import { useEffect, useRef } from 'react'

import { publicApiUrl } from '@/lib/public-api-url'

interface TrackPageViewProps {
  pageId: string
}

export function TrackPageView({ pageId }: TrackPageViewProps) {
  const eventId = useRef(crypto.randomUUID())

  const sent = useRef(false)

  useEffect(() => {
    if (sent.current) return

    sent.current = true

    const params = new URLSearchParams(window.location.search)

    const source = params.get('src') === 'qr' ? 'qr' : undefined

    fetch(`${publicApiUrl}/analytics/views`, {
      method: 'POST',
      keepalive: true,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ pageId, eventId: eventId.current, source }),
    }).catch(() => {})

    if (!params.has('src')) return

    params.delete('src')

    const query = params.size ? `?${params}` : ''

    window.history.replaceState(
      window.history.state,
      '',
      `${window.location.pathname}${query}${window.location.hash}`,
    )
  }, [pageId])

  return null
}
