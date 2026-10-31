import { useTranslations } from 'next-intl'

import { Link } from '@/i18n/navigation'

const LINK_CLASS = 'underline underline-offset-2'

export function LegalNotice() {
  const t = useTranslations('Auth.Legal')

  return (
    <p className="absolute bottom-6 m-0 text-xs text-[#92918b] max-[600px]:bottom-[88px]">
      {t.rich('notice', {
        terms: (chunks) => (
          <Link href="/termos" target="_blank" className={LINK_CLASS}>
            {chunks}
          </Link>
        ),
        privacy: (chunks) => (
          <Link href="/privacidade" target="_blank" className={LINK_CLASS}>
            {chunks}
          </Link>
        ),
      })}
    </p>
  )
}
