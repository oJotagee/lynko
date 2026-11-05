'use client'

import { useMutation } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { Controller } from 'react-hook-form'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { createPage } from '../../_actions/create-page'
import { updatePage } from '../../_actions/update-page'
import type { DashboardData } from '../../_components/dashboard-data'
import { type ProfileSchemaData, useProfileSchema } from '../../_components/schemas'
import { useUnsavedMedia } from '../../_components/upload/use-image-upload'
import { ProfileAvatarField } from './profile-avatar-field'
import { ProfilePublishedField } from './profile-published-field'

interface ProfileFormProps {
  data: DashboardData
  hasPage: boolean
}

export function ProfileForm({ data, hasPage }: ProfileFormProps) {
  const form = useProfileSchema(data.profile)

  const unsavedMedia = useUnsavedMedia()

  const { mutateAsync, isPending } = useMutation({
    mutationFn: hasPage ? updatePage : createPage,
  })

  async function onSubmit(profile: ProfileSchemaData) {
    const response = await mutateAsync({
      ...data,
      profile: { ...profile, published: data.profile.published },
    })

    if (response.error) {
      toast.error(response.error)

      return
    }

    unsavedMedia.flush(profile.avatarMediaId)

    toast.success(hasPage ? 'Página atualizada' : 'Página criada. Agora adicione seus links.')
  }

  return (
    <form className="space-y-6" noValidate onSubmit={form.handleSubmit(onSubmit)}>
      <ProfileAvatarField form={form} hasPage={hasPage} onUploaded={unsavedMedia.track} />

      <Controller
        name="name"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>Nome de exibição</FieldLabel>
            <Input {...field} id={field.name} aria-invalid={fieldState.invalid} />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <Controller
        name="username"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>Nome de usuário</FieldLabel>
            <Input {...field} id={field.name} aria-invalid={fieldState.invalid} />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <Controller
        name="bio"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>Biografia</FieldLabel>
            <Textarea
              {...field}
              id={field.name}
              rows={4}
              maxLength={160}
              className="bg-card"
              aria-invalid={fieldState.invalid}
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <ProfilePublishedField data={data} hasPage={hasPage} />

      <Button type="submit" className="min-h-11 px-5" disabled={isPending}>
        {isPending && <Loader2 className="size-4 animate-spin" />}
        {hasPage ? 'Salvar perfil' : 'Criar minha página'}
      </Button>
    </form>
  )
}
