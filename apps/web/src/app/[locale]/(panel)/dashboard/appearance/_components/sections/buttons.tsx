'use client'

import { type UseFormReturn, useWatch } from 'react-hook-form'

import type { PageAppearance } from '@/app/[locale]/_components/appearance-schema'
import { Field, FieldLabel } from '@/components/ui/field'
import { Switch } from '@/components/ui/switch'
import { ColorField } from './color-field'
import { OptionGroup } from './option-group'

const shapeOptions = [
  { value: 'square', label: 'Reto' },
  { value: 'rounded', label: 'Arredondado' },
  { value: 'pill', label: 'Redondo' },
]

const hoverOptions = [
  { value: 'lift', label: 'Subir' },
  { value: 'grow', label: 'Crescer' },
  { value: 'fade', label: 'Esmaecer' },
  { value: 'invert', label: 'Inverter' },
  { value: 'none', label: 'Nenhum' },
]

export function ButtonsSection({ form }: { form: UseFormReturn<PageAppearance> }) {
  const hoverColor = useWatch({ control: form.control, name: 'buttons.hoverColor' })

  return (
    <section>
      <h2 className="mb-4 text-base font-semibold">Botões</h2>
      <div className="space-y-4">
        <OptionGroup form={form} name="buttons.shape" label="Formato" options={shapeOptions} />
        <ColorField form={form} name="buttons.backgroundColor" label="Botões" />
        <ColorField form={form} name="buttons.textColor" label="Texto dos botões" />
        <div className="space-y-3">
          <p className="text-sm font-medium">Efeito ao passar o mouse</p>
          <OptionGroup
            form={form}
            name="buttons.hoverEffect"
            label="Efeito ao passar o mouse"
            options={hoverOptions}
          />
        </div>
        <Field orientation="horizontal" className="justify-between">
          <FieldLabel htmlFor="buttons-hover-color-toggle">Cor própria no hover</FieldLabel>
          <Switch
            id="buttons-hover-color-toggle"
            checked={!!hoverColor}
            onCheckedChange={(checked) => {
              form.setValue(
                'buttons.hoverColor',
                checked ? form.getValues('buttons.backgroundColor') : undefined,
                { shouldDirty: true },
              )

              form.setValue('theme', 'custom', { shouldDirty: true })
            }}
          />
        </Field>
        {hoverColor && <ColorField form={form} name="buttons.hoverColor" label="Cor no hover" />}
      </div>
    </section>
  )
}
