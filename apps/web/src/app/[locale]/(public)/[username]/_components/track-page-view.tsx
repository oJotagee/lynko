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

    fetch(`${publicApiUrl}/analytics/views`, {
      method: 'POST',
      keepalive: true,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ pageId, eventId: eventId.current }),
    }).catch(() => {})
  }, [pageId])

  return null
}
