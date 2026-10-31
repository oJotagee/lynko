'use client'

import { useTranslations } from 'next-intl'
import { useRef, useState } from 'react'
import { LynkoMascot } from '../lynko-mascot'
import { type PhoneButtonShape, PhonePreview } from '../phone-preview'
import { AppearancePanel } from './appearance-panel'
import type { PaletteId } from './palettes'
import { useScrollProgress } from './use-scroll-progress'

export function StorySection() {
  const t = useTranslations('Home.Story')
  const sectionRef = useRef<HTMLElement>(null)
  const progress = useScrollProgress(sectionRef)
  const [palette, setPalette] = useState<PaletteId>('violet')
  const [buttonShape, setButtonShape] = useState<PhoneButtonShape>('round')

  return (
    <section
      className="mx-auto w-full max-w-[1250px] px-[30px] py-[140px] max-[640px]:px-[14px] max-[640px]:py-16"
      id="features"
      ref={sectionRef}
    >
      <div className="grid grid-cols-[160px_1fr_310px] items-end gap-[15px] max-[900px]:grid-cols-[130px_1fr] max-[640px]:block">
        <span className="text-[11px] font-bold tracking-[0.14em]">{t('eyebrow')}</span>
        <h2 className="m-0 text-[66px] leading-[0.98] tracking-[-0.06em] max-[900px]:text-[54px] max-[640px]:mt-3 max-[640px]:text-[34px]">
          {t('title')}
          <br />
          <em>{t('titleAccent')}</em>
        </h2>
        <p className="text-[length:inherit] leading-[1.6] text-[#74736d] max-[900px]:col-[2] max-[640px]:mt-5">
          {t('description')}
        </p>
      </div>

      <div className="lynko-story-stage">
        <AppearancePanel
          palette={palette}
          buttonShape={buttonShape}
          onPaletteChange={setPalette}
          onButtonShapeChange={setButtonShape}
        />
        <PhonePreview
          theme={palette}
          progress={progress}
          shape={buttonShape}
          className="z-[2] max-[640px]:!mb-5 max-[640px]:!min-h-[500px] max-[640px]:!w-[250px]"
        />
        <span className="absolute top-[140px] right-[7%] z-[3] rotate-[5deg] border border-[#171716] bg-[#fff8d3] px-5 py-[18px] text-[15px] shadow-[3px_4px_0_#171716] max-[640px]:top-[78px] max-[640px]:right-[3%] max-[640px]:max-w-[150px] max-[640px]:text-[10px]">
          {t('quote')}
          <small className="mt-2.5 block text-xs text-[#77766f]">{t('byline')}</small>
        </span>
        <LynkoMascot
          className="absolute right-[5%] bottom-5 rotate-[-8deg] max-[640px]:right-[2%] max-[640px]:bottom-[3px] max-[640px]:!w-[90px]"
          size="sm"
        />
      </div>
    </section>
  )
}
