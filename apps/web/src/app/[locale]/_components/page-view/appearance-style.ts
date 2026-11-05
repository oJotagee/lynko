import type { CSSProperties } from 'react'

import type { PageAppearance } from '../appearance-schema'

const FALLBACK_BACKGROUND = '#ffffff'

const IMAGE_OVERLAY = 'linear-gradient(rgba(0, 0, 0, 0.45), rgba(0, 0, 0, 0.45))'

export const buttonRadius = { square: 0, rounded: 10, pill: 24 } as const

export const socialIconSizes = {
  sm: { box: 'size-8', icon: 'size-4' },
  md: { box: 'size-10', icon: 'size-5' },
  lg: { box: 'size-12', icon: 'size-6' },
} as const

export function getBackgroundStyle(
  { background }: PageAppearance,
  imageUrl?: string | null,
): CSSProperties {
  if (background.type === 'gradient' && background.gradientFrom && background.gradientTo) {
    return {
      backgroundImage: `linear-gradient(160deg, ${background.gradientFrom}, ${background.gradientTo})`,
    }
  }

  if (background.type === 'image' && imageUrl && /^https?:\/\//.test(imageUrl)) {
    return {
      backgroundColor: background.color ?? FALLBACK_BACKGROUND,
      backgroundImage: `${IMAGE_OVERLAY}, url(${JSON.stringify(imageUrl)})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }
  }

  return { background: background.color ?? FALLBACK_BACKGROUND }
}
