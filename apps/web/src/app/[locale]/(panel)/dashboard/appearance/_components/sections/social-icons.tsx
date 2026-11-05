'use client'

import type { UseFormReturn } from 'react-hook-form'

import type { PageAppearance } from '@/app/[locale]/_components/appearance-schema'
import { ColorField } from './color-field'
import { OptionGroup } from './option-group'

const sizeOptions = [
  { value: 'sm', label: 'Pequeno' },
  { value: 'md', label: 'Médio' },
  { value: 'lg', label: 'Grande' },
]

export function SocialIconsSection({ form }: { form: UseFormReturn<PageAppearance> }) {
  return (
    <section>
      <h2 className="mb-4 text-base font-semibold">Ícones sociais</h2>
      <div className="space-y-4">
        <OptionGroup form={form} name="socialIcons.size" label="Tamanho" options={sizeOptions} />
        <ColorField form={form} name="socialIcons.color" label="Ícones sociais" />
      </div>
    </section>
  )
}
