import { type Control, Controller } from 'react-hook-form'

import { Field, FieldLabel } from '@/components/ui/field'
import type { ProfileSchemaData } from './schemas'
import { Switch } from '@/components/ui/switch'

interface ProfilePublishedFieldProps {
  control: Control<ProfileSchemaData>
  hasPage: boolean
}

export function ProfilePublishedField({ control, hasPage }: ProfilePublishedFieldProps) {
  return (
    <Controller
      name="published"
      control={control}
      render={({ field }) => (
        <Field
          orientation="horizontal"
          className="items-center rounded-lg border border-border p-4"
        >
          <div className="flex-1">
            <FieldLabel htmlFor={field.name}>Publicar página</FieldLabel>
            <p className="mt-1 text-xs text-muted-foreground">
              {hasPage
                ? 'Ao salvar, atualiza a visibilidade da sua página na API.'
                : 'A página será criada como rascunho. Publique após adicionar seus links.'}
            </p>
          </div>
          <Switch
            id={field.name}
            disabled={!hasPage}
            checked={field.value}
            onCheckedChange={field.onChange}
          />
        </Field>
      )}
    />
  )
}
