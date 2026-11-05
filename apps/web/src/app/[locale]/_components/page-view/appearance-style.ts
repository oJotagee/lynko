import type { CSSProperties } from 'react'

import type { ButtonHoverEffect, PageAppearance } from '../appearance-schema'

const FALLBACK_BACKGROUND = '#ffffff'

const IMAGE_OVERLAY = 'linear-gradient(rgba(0, 0, 0, 0.45), rgba(0, 0, 0, 0.45))'

export const buttonRadius = { square: 0, rounded: 10, pill: 24 } as const

export const buttonHoverClasses: Record<ButtonHoverEffect, string> = {
  lift: 'hover:-translate-y-0.5 hover:shadow-[0_5px_0_#17171620] focus-visible:-translate-y-0.5',
  grow: 'hover:scale-[1.03] focus-visible:scale-[1.03]',
  fade: 'hover:opacity-80 focus-visible:opacity-80',
  invert: '',
  none: '',
}

export function getButtonStyle(buttons: PageAppearance['buttons']): CSSProperties {
  const inverted = buttons.hoverEffect === 'invert'

  return {
    background: buttons.backgroundColor,
    color: buttons.textColor,
    borderColor: buttons.backgroundColor,
    borderRadius: buttonRadius[buttons.shape],
    '--button-hover-bg':
      buttons.hoverColor ?? (inverted ? buttons.textColor : buttons.backgroundColor),
    '--button-hover-fg': inverted ? buttons.backgroundColor : buttons.textColor,
  } as CSSProperties
}

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
