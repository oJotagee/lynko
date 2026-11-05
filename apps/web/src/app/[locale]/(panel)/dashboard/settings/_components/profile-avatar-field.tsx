'use client'

import { Controller, type UseFormReturn, useWatch } from 'react-hook-form'

import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import type { ProfileSchemaData } from '../../_components/schemas'
import { ImageUpload } from '../../_components/upload/image-upload'

interface ProfileAvatarFieldProps {
  form: UseFormReturn<ProfileSchemaData>
  hasPage: boolean
  onUploaded: (id: string) => void
}

export function ProfileAvatarField({ form, hasPage, onUploaded }: ProfileAvatarFieldProps) {
  const [name, image, avatarMediaId] = useWatch({
    control: form.control,
    name: ['name', 'image', 'avatarMediaId'],
  })

  return (
    <div className="space-y-4">
      <Controller
        name="avatarMediaId"
        control={form.control}
        render={({ field }) => (
          <Field>
            <FieldLabel htmlFor="avatar-upload">Foto</FieldLabel>
            <ImageUpload
              id="avatar-upload"
              type="avatar"
              alt={`Foto de ${name}`}
              imageUrl={image || null}
              disabled={!hasPage}
              onUploaded={(media) => {
                onUploaded(media.id)

                field.onChange(media.id)

                form.setValue('image', media.url ?? '', { shouldDirty: true })
              }}
              onRemove={() => {
                field.onChange(null)

                form.setValue('image', '', { shouldDirty: true })
              }}
            />
            {!hasPage && (
              <p className="text-xs text-muted-foreground">Crie sua página para enviar uma foto.</p>
            )}
          </Field>
        )}
      />
      {!avatarMediaId && (
        <Controller
          name="image"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Ou use a URL de uma foto</FieldLabel>
              <Input {...field} id={field.name} type="url" aria-invalid={fieldState.invalid} />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      )}
    </div>
  )
}
