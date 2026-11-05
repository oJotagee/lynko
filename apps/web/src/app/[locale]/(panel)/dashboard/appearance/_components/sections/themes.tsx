'use client'

import { Check } from 'lucide-react'
import { Controller, type UseFormReturn } from 'react-hook-form'
import { appearanceThemes, type PageAppearance } from '@/app/[locale]/_components/appearance-schema'
import { getBackgroundStyle } from '@/app/[locale]/_components/page-view/appearance-style'
import { Button } from '@/components/ui/button'

export function applyAppearance(form: UseFormReturn<PageAppearance>, appearance: PageAppearance) {
  const options = { shouldDirty: true }

  form.setValue('background', appearance.background, options)

  form.setValue('typography', appearance.typography, options)

  form.setValue('buttons', appearance.buttons, options)

  form.setValue('socialIcons', appearance.socialIcons, options)

  form.setValue('theme', appearance.theme, options)
}

export function ThemesSection({ form }: { form: UseFormReturn<PageAppearance> }) {
  return (
    <section>
      <h2 className="mb-4 text-lg font-bold">Escolha seu clima</h2>
      <Controller
        control={form.control}
        name="theme"
        render={({ field }) => (
          <div className="grid grid-cols-2 gap-3">
            {appearanceThemes.map((theme) => (
              <Button
                key={theme.id}
                type="button"
                variant="outline"
                aria-pressed={field.value === theme.id}
                className={
                  'relative h-auto flex-col items-start gap-3 bg-card p-3 ' +
                  (field.value === theme.id ? 'ring-2 ring-ring' : '')
                }
                onClick={() => applyAppearance(form, theme.appearance)}
              >
                <span
                  className="flex h-20 w-full items-center justify-center rounded-lg"
                  style={getBackgroundStyle(theme.appearance)}
                >
                  <span
                    className="h-3 w-14 rounded-full"
                    style={{ background: theme.appearance.buttons.backgroundColor }}
                  />
                </span>
                <span className="text-xs">{theme.name}</span>
                {field.value === theme.id && <Check className="absolute right-3 bottom-3 size-4" />}
              </Button>
            ))}
            <Button
              type="button"
              variant="outline"
              aria-pressed={field.value === 'custom'}
              className={
                'relative h-auto flex-col items-start gap-3 bg-card p-3 ' +
                (field.value === 'custom' ? 'ring-2 ring-ring' : '')
              }
              onClick={() => form.setValue('theme', 'custom', { shouldDirty: true })}
            >
              <span className="flex h-20 w-full items-center justify-center rounded-lg border border-dashed border-border text-xs text-muted-foreground">
                Suas cores
              </span>
              <span className="text-xs">Custom</span>
              {field.value === 'custom' && <Check className="absolute right-3 bottom-3 size-4" />}
            </Button>
          </div>
        )}
      />
    </section>
  )
}
