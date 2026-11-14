import type { CSSProperties } from 'react'
import { getInitials } from '@/app/[locale]/_components/initials'
import type { ApiPublicPage } from '../_data-access/get-public-page'

export const shareImageSize = { width: 1200, height: 630 }

const FALLBACK_BACKGROUND = '#ffffff'

export function isMediaUrl(url: string | null | undefined, cdnUrl = process.env.MEDIA_CDN_URL) {
  if (!url || !cdnUrl) return false

  const base = cdnUrl.replace(/\/+$/, '')

  return url.startsWith(`${base}/`) && /^https?:\/\//.test(base)
}

function backgroundStyle({ background }: ApiPublicPage['appearance']): CSSProperties {
  if (background.type === 'gradient' && background.gradientFrom && background.gradientTo) {
    return {
      backgroundImage: `linear-gradient(160deg, ${background.gradientFrom}, ${background.gradientTo})`,
    }
  }

  return { backgroundColor: background.color ?? FALLBACK_BACKGROUND }
}

export function ShareImage({ page }: { page: ApiPublicPage }) {
  const { appearance } = page

  const textColor = appearance.typography.textColor

  const backgroundImage =
    appearance.background.type === 'image' && isMediaUrl(page.backgroundImageUrl)
      ? page.backgroundImageUrl
      : null

  const avatar = isMediaUrl(page.avatarUrl) ? page.avatarUrl : null

  return (
    <div
      style={{
        ...backgroundStyle(appearance),
        width: '100%',
        height: '100%',
        display: 'flex',
        position: 'relative',
        color: backgroundImage ? '#ffffff' : textColor,
      }}
    >
      {backgroundImage && (
        <img
          src={backgroundImage}
          alt=""
          width={shareImageSize.width}
          height={shareImageSize.height}
          style={{ position: 'absolute', top: 0, left: 0, objectFit: 'cover' }}
        />
      )}
      {backgroundImage && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.45)',
          }}
        />
      )}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 56,
          padding: '0 96px',
          width: '100%',
        }}
      >
        {avatar ? (
          <img
            src={avatar}
            alt=""
            width={240}
            height={240}
            style={{ borderRadius: 9999, objectFit: 'cover', border: `6px solid ${textColor}` }}
          />
        ) : (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 240,
              height: 240,
              borderRadius: 9999,
              border: `6px solid ${textColor}`,
              backgroundColor: appearance.buttons.backgroundColor,
              color: appearance.buttons.textColor,
              fontSize: 96,
              fontWeight: 700,
            }}
          >
            {getInitials(page.title)}
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>
          <div style={{ fontSize: 76, fontWeight: 700, lineHeight: 1.1 }}>{page.title}</div>
          <div style={{ fontSize: 38, opacity: 0.75 }}>{`@${page.username}`}</div>
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          right: 64,
          bottom: 48,
          fontSize: 30,
          fontWeight: 700,
          opacity: 0.8,
        }}
      >
        lynko
      </div>
    </div>
  )
}
