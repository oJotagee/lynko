import { useEffect, useState } from 'react'

export function useCountdown() {
  const [endsAt, setEndsAt] = useState(0)

  const [now, setNow] = useState(0)

  useEffect(() => {
    if (!endsAt) return

    const timer = setInterval(() => {
      const current = Date.now()

      setNow(current)

      if (current >= endsAt) clearInterval(timer)
    }, 250)

    return () => clearInterval(timer)
  }, [endsAt])

  function start(seconds: number) {
    const current = Date.now()

    setNow(current)

    setEndsAt(current + seconds * 1000)
  }

  return { remaining: Math.max(0, Math.ceil((endsAt - now) / 1000)), start }
}
