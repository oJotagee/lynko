import { useTranslations } from 'next-intl'

export function HowSection() {
  const t = useTranslations('Home.How')
  const steps = [
    { id: '01', title: t('step1Title'), description: t('step1Description'), icon: '✳' },
    { id: '02', title: t('step2Title'), description: t('step2Description'), icon: '↗' },
    { id: '03', title: t('step3Title'), description: t('step3Description'), icon: '◎' },
    { id: '04', title: t('step4Title'), description: t('step4Description'), icon: '→' },
  ]

  return (
    <section
      className="mx-auto w-full max-w-[1250px] px-[30px] py-[140px] max-[900px]:px-6 max-[900px]:py-[100px] max-[640px]:px-[14px] max-[640px]:py-16"
      id="how"
    >
      <div className="flex flex-col items-center text-center">
        <span className="text-[11px] font-bold tracking-[0.14em]">{t('eyebrow')}</span>
        <h2 className="mt-[18px] text-center text-[66px] leading-[0.98] tracking-[-0.06em] max-[900px]:text-[54px] max-[640px]:mt-3 max-[640px]:text-[34px]">
          {t('title')}
          <br />
          <em>{t('titleAccent')}</em>
        </h2>
      </div>

      <div className="mt-[70px] grid grid-cols-4 border-t border-[#d9d8d1] max-[900px]:mt-[35px] max-[900px]:grid-cols-2 max-[640px]:grid-cols-1">
        {steps.map((step, index) => (
          <article
            className="border-r border-[#d9d8d1] px-[22px] py-[25px] last:border-0 max-[900px]:nth-[2]:border-r-0 max-[900px]:nth-[-n+2]:border-b max-[640px]:border-r-0 max-[640px]:border-b max-[640px]:px-3 max-[640px]:py-4"
            key={step.id}
          >
            <span className="text-[11px]">0{index + 1}</span>
            <div className={`lynko-step-art art-${index}`}>{step.icon}</div>
            <h3 className="text-xl">{step.title}</h3>
            <p className="text-sm leading-[1.55] text-[#74736d]">{step.description}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
