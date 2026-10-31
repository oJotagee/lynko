import { useTranslations } from 'next-intl'

import type { PhoneButtonShape } from '../phone-preview'
import { PALETTES, type PaletteId } from './palettes'

interface AppearancePanelProps {
  palette: PaletteId
  buttonShape: PhoneButtonShape
  onPaletteChange: (palette: PaletteId) => void
  onButtonShapeChange: (shape: PhoneButtonShape) => void
}

export function AppearancePanel({
  palette,
  buttonShape,
  onPaletteChange,
  onButtonShapeChange,
}: AppearancePanelProps) {
  const t = useTranslations('Home.Appearance')

  return (
    <div className="absolute top-[100px] left-[6%] z-[3] w-[290px] rotate-[-6deg] rounded-[14px] border border-[#aca7cb] bg-white p-[18px] shadow-[3px_4px_0_#171716] max-[900px]:left-[3%] max-[900px]:w-[240px] max-[640px]:static max-[640px]:w-full max-[640px]:max-w-[320px] max-[640px]:rotate-0 max-[640px]:p-4">
      <div className="mb-5 flex items-center gap-[5px] border-b border-[#d9d8d1] pb-3">
        <i className="size-2 rounded-full bg-[#ccc]" />
        <i className="size-2 rounded-full bg-[#ccc]" />
        <i className="size-2 rounded-full bg-[#ccc]" />
        <b className="ml-auto text-xs">{t('title')}</b>
      </div>

      <span className="mt-[18px] mb-2 block text-[11px]">{t('theme')}</span>
      <div className="flex gap-[7px]">
        {PALETTES.slice(0, 3).map((item) => (
          <button
            type="button"
            key={item.id}
            aria-pressed={palette === item.id}
            className={`cursor-pointer rounded-[7px] border px-3 py-2 text-[11px] ${palette === item.id ? 'border-[#171716] shadow-[0_0_0_1px_#171716]' : 'border-[#d9d8d1]'} bg-[#fafafa]`}
            onClick={() => onPaletteChange(item.id)}
          >
            {item.name}
          </button>
        ))}
      </div>

      <span className="mt-[18px] mb-2 block text-[11px]">{t('background')}</span>
      <div className="flex gap-[7px]">
        {PALETTES.map((item) => (
          <button
            type="button"
            key={item.id}
            aria-label={t('useTheme', { theme: item.name })}
            aria-pressed={palette === item.id}
            onClick={() => onPaletteChange(item.id)}
            className={`size-[25px] cursor-pointer rounded-md border border-[#d9d8d1] ${palette === item.id ? 'outline-2 outline-offset-2 outline-[#171716]' : ''}`}
            style={{ backgroundColor: item.swatch }}
          />
        ))}
      </div>

      <span className="mt-[18px] mb-2 block text-[11px]">{t('buttonShape')}</span>
      <div className="flex gap-[7px]">
        {(['soft', 'round', 'sharp'] as const).map((shape) => (
          <button
            type="button"
            key={shape}
            aria-pressed={buttonShape === shape}
            className={`cursor-pointer rounded-[7px] border px-3 py-2 text-[11px] ${buttonShape === shape ? 'border-[#171716] shadow-[0_0_0_1px_#171716]' : 'border-[#d9d8d1]'} bg-[#fafafa]`}
            onClick={() => onButtonShapeChange(shape)}
          >
            {shape === 'soft' ? t('soft') : shape === 'round' ? t('round') : t('sharp')}
          </button>
        ))}
      </div>
    </div>
  )
}
