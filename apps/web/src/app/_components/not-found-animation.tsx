'use client'

import { type LottieHandle, LottieLight } from 'lottie-react'
import { useRef, useState } from 'react'

import animationData from '../../../public/animation/lynko-404.json'

export function NotFoundAnimation() {
  const lottieRef = useRef<LottieHandle>(null)
  const [ready, setReady] = useState(false)

  function handleReady() {
    setReady(true)
    lottieRef.current?.play()
  }

  return (
    <LottieLight
      lottieRef={lottieRef}
      src={animationData}
      loop
      autoplay
      subscriptions={{ ready: handleReady }}
      className={`size-full transition-opacity duration-500 ease-out ${ready ? 'opacity-100' : 'opacity-0'}`}
    />
  )
}
