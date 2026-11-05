'use client'

import type { UseFormReturn } from 'react-hook-form'

import type { PageAppearance } from '@/app/[locale]/_components/appearance-schema'
import { ColorField } from './color-field'
import { OptionGroup } from './option-group'

const shapeOptions = [
  { value: 'square', label: 'Reto' },
  { value: 'rounded', label: 'Arredondado' },
  { value: 'pill', label: 'Redondo' },
]

export function ButtonsSection({ form }: { form: UseFormReturn<PageAppearance> }) {
  return (
    <section>
      <h2 className="mb-4 text-base font-semibold">Botões</h2>
      <div className="space-y-4">
        <OptionGroup form={form} name="buttons.shape" label="Formato" options={shapeOptions} />
        <ColorField form={form} name="buttons.backgroundColor" label="Botões" />
        <ColorField form={form} name="buttons.textColor" label="Texto dos botões" />
      </div>
    </section>
  )
}
