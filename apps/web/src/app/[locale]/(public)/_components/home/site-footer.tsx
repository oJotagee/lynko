import { LynkoMascot } from '../lynko-mascot'
import { useTranslations } from 'next-intl'
import { LynkoLogo } from '../lynko-logo'
import { Link } from '@/i18n/navigation'
import { CtaLink } from './cta-link'

export function SiteFooter() {
  const t = useTranslations('Home.Footer')

  return (
    <footer className="relative grid min-h-[370px] grid-cols-[1.5fr_1fr_auto] gap-10 bg-[#171716] px-[max(calc((100%-1250px)/2),40px)] pt-[60px] pb-[90px] text-white max-[900px]:grid-cols-[1fr_1.4fr] max-[640px]:min-h-0 max-[640px]:grid-cols-1 max-[640px]:gap-[34px] max-[640px]:px-6 max-[640px]:pt-[45px] max-[640px]:pb-[75px]">
      <div>
        <LynkoLogo className="lynko-home-logo" />
        <h2 className="my-2.5 max-w-[280px] text-[30px] leading-none max-[640px]:text-[34px]">
          {t('title')}
          <br />
          {t('titleAccent')}
        </h2>
        <CtaLink className="bg-[#b7f34a] text-[#171716] hover:bg-[#b7f34a] hover:text-[#171716]">
          {t('create')} →
        </CtaLink>
      </div>

      <div className="grid grid-cols-3 gap-[25px] max-[640px]:grid-cols-3">
        <p className="m-0 grid content-start gap-[14px] text-xs max-[640px]:text-[10px]">
          <b>{t('product')}</b>
          <a
            className="text-[#aaa9a4] no-underline hover:underline hover:underline-offset-[3px]"
            href="#features"
          >
            {t('features')}
          </a>
          <a
            className="text-[#aaa9a4] no-underline hover:underline hover:underline-offset-[3px]"
            href="#pricing"
          >
            {t('pricing')}
          </a>
          <Link
            className="text-[#aaa9a4] no-underline hover:underline hover:underline-offset-[3px]"
            href="/login"
          >
            {t('dashboard')}
          </Link>
        </p>
        <p className="m-0 grid content-start gap-[14px] text-xs max-[640px]:text-[10px]">
          <b>{t('company')}</b>
          <a
            className="text-[#aaa9a4] no-underline hover:underline hover:underline-offset-[3px]"
            href="#footer"
          >
            {t('about')}
          </a>
          <a
            className="text-[#aaa9a4] no-underline hover:underline hover:underline-offset-[3px]"
            href="#footer"
          >
            {t('privacy')}
          </a>
          <a
            className="text-[#aaa9a4] no-underline hover:underline hover:underline-offset-[3px]"
            href="#footer"
          >
            {t('terms')}
          </a>
        </p>
      </div>

      <LynkoMascot className="self-center max-[900px]:hidden" size="sm" />
      <small
        className="absolute bottom-[25px] left-[max(calc((100%-1250px)/2),40px)] text-xs text-[#898983] max-[640px]:left-6"
        id="footer"
      >
        {t('copyright', { year: new Date().getFullYear() })}
      </small>
    </footer>
  )
}
