'use client'

import { Controller, type UseFormReturn } from 'react-hook-form'
import type { PageAppearance } from '@/app/[locale]/_components/appearance-schema'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'

export type ColorPath =
  | 'background.color'
  | 'background.gradientFrom'
  | 'background.gradientTo'
  | 'typography.textColor'
  | 'buttons.backgroundColor'
  | 'buttons.textColor'
  | 'socialIcons.color'

interface ColorFieldProps {
  form: UseFormReturn<PageAppearance>
  name: ColorPath
  label: string
}

export function ColorField({ form, name, label }: ColorFieldProps) {
  return (
    <Controller
      control={form.control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <div className="flex items-center justify-between gap-4">
            <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground uppercase">{field.value}</span>
              <Input
                id={field.name}
                type="color"
                value={field.value ?? '#ffffff'}
                aria-invalid={fieldState.invalid}
                className="size-11 cursor-pointer p-1"
                onChange={(event) => {
                  field.onChange(event.target.value)

                  if (form.getValues('theme') !== 'custom') {
                    form.setValue('theme', 'custom', { shouldDirty: true })
                  }
                }}
              />
            </div>
          </div>
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  )
}
