'use client'

import { useMutation } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Controller } from 'react-hook-form'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Link } from '@/i18n/navigation'
import { AUTH_ACTION_CLASS } from '../../_components/auth-action-class'
import { forgotPassword } from '../_actions/forgot-password'
import { type ForgotPasswordSchemaData, useForgotPasswordSchema } from './forgot-password-schema'

export function ForgotPasswordForm() {
  const form = useForgotPasswordSchema()

  const t = useTranslations('Auth.ForgotPassword')

  const { mutate, isPending, data } = useMutation({
    mutationFn: ({ email }: ForgotPasswordSchemaData) => forgotPassword(email),
    onSuccess: (response) => {
      if (response.error) toast.error(response.error)
    },
    onError: () => toast.error('Não foi possível enviar o link agora. Tente novamente.'),
  })

  const sent = data !== undefined && !data.error

  return (
    <div className="w-full max-w-[430px]">
      <header className="mb-8 text-center" aria-live="polite">
        <h2 className="mb-2 text-[34px] tracking-[-0.04em] max-[600px]:text-[30px]">
          {sent ? t('sentTitle') : t('title')}
        </h2>
        <p className="m-0 text-sm text-muted-foreground max-[600px]:text-[13px]">
          {sent ? t('sentDescription') : t('description')}
        </p>
      </header>

      {!sent && (
        <form
          className="flex flex-col gap-[14px]"
          onSubmit={form.handleSubmit((values) => mutate(values))}
          noValidate
        >
          <Controller
            name="email"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} className="gap-0">
                <FieldLabel className="mb-1.5 text-xs font-semibold" htmlFor={field.name}>
                  {t('email')}
                </FieldLabel>
                <Input
                  {...field}
                  id={field.name}
                  className="h-12 text-[13px]"
                  type="email"
                  autoComplete="email"
                  placeholder={t('emailPlaceholder')}
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && (
                  <FieldError className="mt-[5px] text-xs" errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Button className={AUTH_ACTION_CLASS} type="submit" disabled={isPending}>
            {isPending ? t('submitting') : t('submit')}
            {isPending ? (
              <Loader2 className="size-4 animate-spin motion-reduce:animate-none" />
            ) : (
              <span aria-hidden="true">→</span>
            )}
          </Button>
        </form>
      )}

      <p className="mt-6 mb-0 text-center text-xs">
        <Link className="font-semibold underline" href="/login">
          {t('backToLogin')}
        </Link>
      </p>
    </div>
  )
}
