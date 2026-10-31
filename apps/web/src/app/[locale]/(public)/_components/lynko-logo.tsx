import { useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'

interface LynkoLogoProps {
  className: string
}

export function LynkoLogo({ className }: LynkoLogoProps) {
  const t = useTranslations('Common')

  return (
    <Link href="/" className={className} aria-label={`Lynko, ${t('backHome')}`}>
      <span className="lynko-logo-mark" aria-hidden="true">
        <i />
        <i />
      </span>
      <strong>lynko</strong>
    </Link>
  )
}
