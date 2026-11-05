'use client'

import type { UseFormReturn } from 'react-hook-form'

import { FONT_FAMILIES, type PageAppearance } from '@/app/[locale]/_components/appearance-schema'
import { fontFamilyNames, fontFamilyStyles } from '@/app/[locale]/_components/page-view/fonts'
import { ColorField } from './color-field'
import { OptionGroup } from './option-group'

const fontOptions = FONT_FAMILIES.map((font) => ({
  value: font,
  label: fontFamilyNames[font],
  style: { fontFamily: fontFamilyStyles[font] },
}))

export function TypographySection({ form }: { form: UseFormReturn<PageAppearance> }) {
  return (
    <section>
      <h2 className="mb-4 text-base font-semibold">Tipografia</h2>
      <div className="space-y-4">
        <OptionGroup form={form} name="typography.fontFamily" label="Fonte" options={fontOptions} />
        <ColorField form={form} name="typography.textColor" label="Texto" />
      </div>
    </section>
  )
}
