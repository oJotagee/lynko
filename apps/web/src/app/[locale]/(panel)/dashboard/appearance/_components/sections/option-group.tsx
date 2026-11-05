'use client'

import type { CSSProperties } from 'react'
import { Controller, type UseFormReturn } from 'react-hook-form'
import type { PageAppearance } from '@/app/[locale]/_components/appearance-schema'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

export type OptionPath = 'typography.fontFamily' | 'buttons.shape' | 'socialIcons.size'

interface OptionGroupProps {
  form: UseFormReturn<PageAppearance>
  name: OptionPath
  label: string
  options: readonly { value: string; label: string; style?: CSSProperties }[]
}

export function OptionGroup({ form, name, label, options }: OptionGroupProps) {
  return (
    <Controller
      control={form.control}
      name={name}
      render={({ field }) => (
        <ToggleGroup
          variant="outline"
          aria-label={label}
          value={[field.value]}
          onValueChange={([value]) => {
            if (!value) return

            field.onChange(value)

            form.setValue('theme', 'custom', { shouldDirty: true })
          }}
          className="flex-wrap"
        >
          {options.map((option) => (
            <ToggleGroupItem
              key={option.value}
              value={option.value}
              className="min-h-11 px-4"
              style={option.style}
            >
              {option.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      )}
    />
  )
}
