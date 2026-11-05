'use client'

import { Controller, type UseFormReturn, useWatch } from 'react-hook-form'
import type { PageAppearance } from '@/app/[locale]/_components/appearance-schema'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { ImageUpload } from '../../../_components/upload/image-upload'
import { ColorField } from './color-field'

type BackgroundType = PageAppearance['background']['type']

export interface BackgroundImageProps {
  imageUrl: string | null
  onImageChange: (image: { id: string; url: string | null } | null) => void
}

interface BackgroundSectionProps extends BackgroundImageProps {
  form: UseFormReturn<PageAppearance>
}

export function BackgroundSection({ form, imageUrl, onImageChange }: BackgroundSectionProps) {
  const type = useWatch({ control: form.control, name: 'background.type' })

  function changeType(next: BackgroundType) {
    const current = form.getValues('background')

    const color = current.color ?? current.gradientFrom ?? '#ffffff'

    const backgrounds: Record<BackgroundType, PageAppearance['background']> = {
      solid: { type: 'solid', color },
      gradient: {
        type: 'gradient',
        gradientFrom: current.gradientFrom ?? current.color ?? '#9b8cff',
        gradientTo: current.gradientTo ?? '#ffd7ca',
      },
      image: { type: 'image', color, imageMediaId: current.imageMediaId },
    }

    form.setValue('background', backgrounds[next], { shouldDirty: true })

    form.setValue('theme', 'custom', { shouldDirty: true })
  }

  return (
    <section>
      <h2 className="mb-4 text-base font-semibold">Fundo</h2>
      <div className="space-y-4">
        <Controller
          control={form.control}
          name="background.type"
          render={({ field }) => (
            <ToggleGroup
              variant="outline"
              aria-label="Tipo de fundo"
              value={[field.value]}
              onValueChange={([value]) => {
                if (value === 'solid' || value === 'gradient' || value === 'image') {
                  changeType(value)
                }
              }}
            >
              <ToggleGroupItem value="solid" className="min-h-11 px-4">
                Cor sólida
              </ToggleGroupItem>
              <ToggleGroupItem value="gradient" className="min-h-11 px-4">
                Gradiente
              </ToggleGroupItem>
              <ToggleGroupItem value="image" className="min-h-11 px-4">
                Imagem
              </ToggleGroupItem>
            </ToggleGroup>
          )}
        />
        {type === 'gradient' && (
          <>
            <ColorField form={form} name="background.gradientFrom" label="Cor inicial" />
            <ColorField form={form} name="background.gradientTo" label="Cor final" />
          </>
        )}
        {type === 'solid' && <ColorField form={form} name="background.color" label="Fundo" />}
        {type === 'image' && (
          <Controller
            control={form.control}
            name="background.imageMediaId"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="background-upload">Imagem de fundo</FieldLabel>
                <ImageUpload
                  id="background-upload"
                  type="background"
                  alt="Imagem de fundo da página"
                  imageUrl={field.value ? imageUrl : null}
                  invalid={fieldState.invalid}
                  onUploaded={(media) => {
                    field.onChange(media.id)

                    onImageChange({ id: media.id, url: media.url })
                  }}
                  onRemove={() => {
                    field.onChange(undefined)

                    onImageChange(null)
                  }}
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        )}
      </div>
    </section>
  )
}
