import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { LocaleSwitcher } from '../locale-switcher'
import { LynkoLogo } from '../lynko-logo'
import { CtaLink } from './cta-link'

const NAV_LINK_CLASS = 'underline-offset-2 hover:underline'

export function SiteHeader() {
  const t = useTranslations('Home.Header')

  return (
    <header className="mx-auto flex h-[78px] w-full max-w-[1340px] items-center justify-between border-b border-[#d9d8d1] px-8 max-[900px]:h-[68px] max-[900px]:px-6 max-[640px]:h-[52px] max-[640px]:px-4">
      <LynkoLogo className="lynko-home-logo" />
      <nav className="flex gap-8 max-[900px]:gap-4 max-[900px]:hidden" aria-label={t('navigation')}>
        <a className={NAV_LINK_CLASS} href="#features">
          {t('features')}
        </a>
        <a className={NAV_LINK_CLASS} href="#how">
          {t('how')}
        </a>
        <a className={NAV_LINK_CLASS} href="#pricing">
          {t('pricing')}
        </a>
      </nav>
      <div className="flex items-center gap-[18px] max-[640px]:gap-0">
        <Link
          className={`text-sm text-[#4d4c48] max-[640px]:hidden ${NAV_LINK_CLASS}`}
          href="/login"
        >
          {t('login')}
        </Link>
        <LocaleSwitcher className="mr-2" />
        <CtaLink className="max-[640px]:!min-h-[34px] max-[640px]:!px-[10px] max-[640px]:!text-[10px]">
          {t('create')} <span>→</span>
        </CtaLink>
      </div>
    </header>
  )
}
