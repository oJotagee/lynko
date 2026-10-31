import { type RefObject, useEffect, useState } from 'react'

export function useScrollProgress(ref: RefObject<HTMLElement | null>) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const update = () => {
      if (reduceMotion) {
        setProgress(1)
        return
      }

      const bounds = node.getBoundingClientRect()
      const travel = Math.max(1, node.offsetHeight - window.innerHeight)
      setProgress(Math.max(0, Math.min(1, -bounds.top / travel)))
    }

    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)

    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [ref])

  return progress
}
