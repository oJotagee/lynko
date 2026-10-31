import { AnalyticsPreview } from './analytics-preview'
import { PhonePreview } from '../phone-preview'
import { LynkoMascot } from '../lynko-mascot'
import { Eye, Sparkles } from 'lucide-react'
import { useTranslations } from 'next-intl'

export function FeaturesSection() {
  const t = useTranslations('Home.Features')

  return (
    <section className="mx-auto w-full max-w-[1250px] px-[30px] py-[140px] max-[900px]:px-6 max-[900px]:py-[100px] max-[640px]:px-[14px] max-[640px]:py-16">
      <article className="grid min-h-[540px] grid-cols-[0.8fr_1.2fr] items-center gap-[45px] rounded-[22px] bg-[#171716] p-[60px] text-white max-[900px]:grid-cols-2 max-[900px]:p-[35px] max-[640px]:grid-cols-1 max-[640px]:px-[22px] max-[640px]:py-7">
        <div>
          <span className="text-[11px] font-bold tracking-[0.14em]">{t('analyticsLabel')}</span>
          <h2 className="my-3 max-w-[300px] text-[40px] leading-[1.05] max-[640px]:text-[30px]">
            {t('analyticsTitle')}
          </h2>
          <p className="mb-[18px] text-[#aaa9a4] leading-[1.6]">{t('analyticsDescription')}</p>
          <a
            href="#pricing"
            className="inline-flex min-h-11 items-center justify-center gap-[9px] rounded-[10px] border border-[#171716] bg-white px-5 text-sm font-semibold text-[#171716] no-underline transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[0_5px_0_#17171620]"
          >
            {t('exploreAnalytics')} →
          </a>
        </div>
        <AnalyticsPreview />
      </article>

      <div className="mt-5 grid grid-cols-2 gap-5 max-[640px]:grid-cols-1">
        <article className="relative min-h-[430px] overflow-hidden rounded-[22px] border border-[#d9d8d1] p-[30px]">
          <span className="lynko-icon-chip">
            <Eye size={18} strokeWidth={1.5} />
          </span>
          <h3 className="text-xl">{t('screenTitle')}</h3>
          <p className="text-sm leading-[1.55] text-[#74736d]">{t('screenDescription')}</p>
          <PhonePreview
            theme="peach"
            progress={1}
            className="lynko-device-phone !bottom-[-300px] !w-[230px] max-w-[calc(100%-32px)] ![transform:translateX(-50%)]"
          />
        </article>

        <article className="lynko-feature-lime relative flex min-h-[430px] flex-col items-center overflow-hidden rounded-[22px] p-[30px]">
          <LynkoMascot animated={false} />
          <div>
            <span className="lynko-icon-chip">
              <Sparkles size={18} strokeWidth={1.5} />
            </span>
            <h3 className="text-xl">{t('simpleTitle')}</h3>
            <p className="text-sm leading-[1.55] text-[#74736d]">{t('simpleDescription')}</p>
          </div>
        </article>
      </div>
    </section>
  )
}
