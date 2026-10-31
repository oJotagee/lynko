import { useTranslations } from 'next-intl'
import { Share2 } from 'lucide-react'

import { cn } from '@/lib/utils'

interface PhonePreviewProps {
  theme?: string
  progress?: number
  className?: string
  shape?: PhoneButtonShape
}

export type PhoneButtonShape = 'soft' | 'round' | 'sharp'

export function PhonePreview({
  theme = 'lime',
  progress = 1,
  className,
  shape = 'round',
}: PhonePreviewProps) {
  const t = useTranslations('Home.Phone')
  const offset = Math.round((1 - progress) * 24)

  return (
    <div
      className={cn(
        'lynko-phone [transform-style:flat]',
        `lynko-phone-${theme}`,
        `lynko-phone-shape-${shape}`,
        className,
      )}
      style={{
        transform: offset === 0 ? 'none' : `translateY(${offset}px)`,
      }}
    >
      <div className="lynko-phone-status">
        <b>9:41</b>
        <span aria-hidden="true">•••</span>
      </div>
      <button className="lynko-phone-share" type="button" aria-label={t('share')}>
        <Share2 size={13} strokeWidth={1.5} />
      </button>
      <div className="lynko-phone-avatar">MS</div>
      <strong>Maya Santos</strong>
      <small>@maya · {t('role')}</small>
      <p>{t('bio')}</p>
      <div className="lynko-phone-socials">
        <b>in</b>
        <b>◎</b>
        <b>◉</b>
        <b>♪</b>
      </div>
      <div className="lynko-phone-links">
        <div>
          <i />
          {t('link1')} <span>→</span>
        </div>
        <div>
          <i />
          {t('link2')} <span>→</span>
        </div>
        <div>
          <i />
          {t('link3')} <span>→</span>
        </div>
      </div>
      <small className="lynko-phone-brand">◎ {t('madeWith')}</small>
    </div>
  )
}
