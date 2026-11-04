'use client'

import { useMutation } from '@tanstack/react-query'
import { Controller } from 'react-hook-form'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { type ProfileSchemaData, useProfileSchema } from '../schemas'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { ProfilePublishedField } from './profile-published-field'
import { createPage } from '../../_actions/create-page'
import { updatePage } from '../../_actions/update-page'
import type { DashboardData } from '../dashboard-data'
import { Textarea } from '@/components/ui/textarea'
import { ProfileAvatar } from './profile-avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface ProfileFormProps {
  data: DashboardData
  hasPage: boolean
}

export function ProfileForm({ data, hasPage }: ProfileFormProps) {
  const form = useProfileSchema(data.profile)

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

    toast.success(hasPage ? 'Página atualizada' : 'Página criada. Agora adicione seus links.')
  }

  return (
    <form className="space-y-6" noValidate onSubmit={form.handleSubmit(onSubmit)}>
      <ProfileAvatar
        profile={{ ...data.profile, name: form.watch('name'), image: form.watch('image') }}
        large
      />

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

      <Controller
        name="image"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>URL da foto</FieldLabel>
            <Input {...field} id={field.name} type="url" aria-invalid={fieldState.invalid} />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            <p className="text-xs text-muted-foreground">
              Use uma URL de imagem com https. Upload de arquivo ainda não está disponível.
            </p>
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
