import { useTranslations } from 'next-intl'

import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { LynkoMascot } from '../lynko-mascot'
import { PhonePreview } from '../phone-preview'
import { CtaLink } from './cta-link'

export function HeroSection() {
  const t = useTranslations('Home.Hero')

  return (
    <section className="mx-auto grid min-h-[760px] w-full max-w-[1340px] grid-cols-2 items-center px-[50px] py-20 max-[900px]:min-h-[680px] max-[900px]:px-7 max-[900px]:py-[50px] max-[900px]:grid-cols-2 max-[900px]:gap-5 max-[640px]:min-h-0 max-[640px]:grid-cols-1 max-[640px]:gap-3 max-[640px]:px-[14px] max-[640px]:pt-[30px] max-[640px]:pb-6 max-[640px]:text-center">
      <div className="relative z-[2]">
        <h1 className="my-[27px] text-[clamp(54px,6vw,88px)] leading-[0.98] font-bold tracking-[-0.06em] max-[900px]:text-[clamp(48px,7vw,68px)] max-[640px]:my-[18px] max-[640px]:text-[clamp(36px,10vw,48px)]">
          {t('title')}
          <br />
          <em>{t('titleAccent')}</em>
        </h1>
        <p className="max-w-[570px] text-[19px] leading-[1.6] text-[#5a5954] max-[640px]:mx-auto max-[640px]:my-0 max-[640px]:text-xs max-[640px]:leading-[1.5]">
          {t('description')}
        </p>
        <div className="my-[34px] flex flex-wrap gap-3 max-[640px]:my-5 max-[640px]:grid max-[640px]:gap-2">
          <CtaLink className="max-[640px]:!w-full max-[640px]:!min-h-9 max-[640px]:!text-[10px]">
            {t('create')} <span>→</span>
          </CtaLink>
          <a
            className={cn(
              buttonVariants(),
              'inline-flex min-h-11 items-center justify-center gap-[9px] rounded-[10px] border border-[#171716] bg-[#f7f6f1] px-5 text-sm font-semibold text-[#171716] no-underline transition-[transform,box-shadow,background-color] duration-200 hover:-translate-y-0.5 hover:bg-[#f7f6f1] hover:text-[#171716] hover:shadow-[0_5px_0_#17171620] max-[640px]:!w-full max-[640px]:!min-h-9 max-[640px]:!text-[10px]',
            )}
            href="#features"
          >
            {t('example')} <span>◎</span>
          </a>
        </div>
      </div>

      <div className="lynko-hero-art">
        <i className="lynko-orbit lynko-orbit-one" />
        <i className="lynko-orbit lynko-orbit-two" />
        <span className="lynko-float-note lynko-note-clicks">↗ {t('clicks')}</span>
        <span className="lynko-float-note lynko-note-theme">◎ {t('theme')}</span>
        <PhonePreview progress={1} />
        <LynkoMascot size="sm" className="lynko-hero-mascot" />
      </div>
    </section>
  )
}
