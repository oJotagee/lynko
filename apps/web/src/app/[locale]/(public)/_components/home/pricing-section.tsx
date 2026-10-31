import { useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
import { CtaLink } from './cta-link'

function FeatureList({ features }: { features: string[] }) {
  return (
    <ul className="grid list-none gap-3 border-t pt-[18px] text-[13px]">
      {features.map((feature) => (
        <li key={feature}>✓ {feature}</li>
      ))}
    </ul>
  )
}

export function PricingSection() {
  const t = useTranslations('Home.Pricing')
  const freeFeatures = [t('free1'), t('free2'), t('free3'), t('free4')]
  const proFeatures = [t('pro1'), t('pro2'), t('pro3'), t('pro4')]

  return (
    <section
      className="mx-auto w-full max-w-[1250px] px-[30px] py-[140px] max-[900px]:px-6 max-[900px]:py-[100px] max-[640px]:px-[14px] max-[640px]:py-16"
      id="pricing"
    >
      <div className="flex flex-col items-center text-center">
        <span className="text-[11px] font-bold tracking-[0.14em]">{t('eyebrow')}</span>
        <h2 className="mt-[18px] mb-[27px] text-[clamp(34px,6vw,66px)] leading-[0.98] font-bold tracking-[-0.06em]">
          {t('title')}
          <br />
          <em>{t('titleAccent')}</em>
        </h2>
      </div>

      <div className="mx-auto mt-[70px] grid max-w-[900px] grid-cols-2 gap-5 max-[640px]:mt-[35px] max-[640px]:grid-cols-1">
        <article className="relative rounded-[14px] border border-[#d9d8d1] bg-white p-[30px] [&_ul]:border-[#d9d8d1]">
          <span className="text-[11px] font-bold tracking-[0.14em]">{t('free')}</span>
          <h3 className="my-3 text-[32px] font-bold [&_small]:text-xs [&_small]:font-normal [&_small]:text-[#74736d]">
            $0 <small>{t('forever')}</small>
          </h3>
          <p className="text-[#74736d] leading-[1.5]">{t('freeDescription')}</p>
          <CtaLink className="my-[15px] w-full">{t('start')}</CtaLink>
          <FeatureList features={freeFeatures} />
        </article>

        <article className="relative rounded-[14px] border border-[#d9d8d1] bg-[#171716] p-[30px] text-white [&_ul]:border-[#38383c]">
          <b className="absolute top-6 right-6 rounded-[5px] bg-[#9b8cff] px-2 py-1.5 text-[8px] text-[#171716]">
            {t('comingSoon')}
          </b>
          <span className="text-[11px] font-bold tracking-[0.14em]">{t('pro')}</span>
          <h3 className="my-3 text-[32px] font-bold [&_small]:text-xs [&_small]:font-normal [&_small]:text-[#aaa9a4]">
            $8 <small>{t('month')}</small>
          </h3>
          <p className="text-[#aaa9a4] leading-[1.5]">{t('proDescription')}</p>
          <Button className="my-[15px] w-full" variant="outline" disabled>
            {t('waitlist')}
          </Button>
          <FeatureList features={proFeatures} />
        </article>
      </div>
    </section>
  )
}
