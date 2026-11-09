'use client'

import { useMutation } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { Controller } from 'react-hook-form'
import { toast } from 'sonner'

import { PasswordToggleButton } from '@/app/[locale]/(public)/_components/password-toggle-button'
import {
  PasswordVisibilityProvider,
  usePasswordVisibility,
} from '@/app/[locale]/(public)/_components/password-visibility'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { changePassword } from '../../_actions/change-password'
import { type ChangePasswordSchemaData, useChangePasswordSchema } from './change-password-schema'

function ChangePasswordFields() {
  const form = useChangePasswordSchema()

  const { visible } = usePasswordVisibility()

  const type = visible ? 'text' : 'password'

  const { mutate, isPending } = useMutation({
    mutationFn: ({ currentPassword, newPassword }: ChangePasswordSchemaData) =>
      changePassword({ currentPassword, newPassword }),
    onSuccess: (response) => {
      if (response.error) {
        toast.error(response.error)

        return
      }

      form.reset()

      toast.success('Senha alterada. Os outros dispositivos foram desconectados.')
    },
    onError: () => toast.error('Não foi possível alterar a senha. Tente novamente.'),
  })

  return (
    <form
      className="flex max-w-xl flex-col gap-5"
      noValidate
      onSubmit={form.handleSubmit((values) => mutate(values))}
    >
      <Controller
        name="currentPassword"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>Senha atual</FieldLabel>
            <div className="relative">
              <Input
                {...field}
                id={field.name}
                className="pr-12"
                type={type}
                autoComplete="current-password"
                aria-invalid={fieldState.invalid}
              />
              <PasswordToggleButton showLabel="Mostrar senhas" hideLabel="Ocultar senhas" />
            </div>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <Controller
        name="newPassword"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>Nova senha</FieldLabel>
            <Input
              {...field}
              id={field.name}
              type={type}
              autoComplete="new-password"
              aria-invalid={fieldState.invalid}
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <Controller
        name="confirmPassword"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>Confirmar nova senha</FieldLabel>
            <Input
              {...field}
              id={field.name}
              type={type}
              autoComplete="new-password"
              aria-invalid={fieldState.invalid}
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <Button type="submit" className="min-h-11 self-start px-5" disabled={isPending}>
        {isPending && <Loader2 className="animate-spin motion-reduce:animate-none" />}
        Alterar senha
      </Button>
    </form>
  )
}

export function ChangePasswordForm() {
  return (
    <PasswordVisibilityProvider>
      <ChangePasswordFields />
    </PasswordVisibilityProvider>
  )
}
