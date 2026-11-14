import { useEffect, useState } from 'react'

export function useNow(intervalMs = 30_000) {
  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    setNow(new Date())

    const timer = setInterval(() => setNow(new Date()), intervalMs)

    return () => clearInterval(timer)
  }, [intervalMs])

  return now
}
