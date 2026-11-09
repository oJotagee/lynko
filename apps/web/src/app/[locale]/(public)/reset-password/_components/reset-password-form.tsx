'use client'

import { useMutation } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Controller } from 'react-hook-form'
import { toast } from 'sonner'

import { Button, buttonVariants } from '@/components/ui/button'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Link, useRouter } from '@/i18n/navigation'
import { cn } from '@/lib/utils'
import { AUTH_ACTION_CLASS } from '../../_components/auth-action-class'
import { PasswordToggleButton } from '../../_components/password-toggle-button'
import { usePasswordVisibility } from '../../_components/password-visibility'
import { resetPassword } from '../_actions/reset-password'
import { type ResetPasswordSchemaData, useResetPasswordSchema } from './reset-password-schema'

export function ResetPasswordForm({ token }: { token?: string }) {
  const form = useResetPasswordSchema()

  const router = useRouter()

  const { visible } = usePasswordVisibility()

  const t = useTranslations('Auth.ResetPassword')

  const passwordText = useTranslations('Auth.Password')

  const { mutate, isPending, data } = useMutation({
    mutationFn: ({ password }: ResetPasswordSchemaData) =>
      resetPassword({ token: token ?? '', password }),
    onSuccess: (response) => {
      if (response.error) {
        if (!response.invalid) toast.error(response.error)

        return
      }

      toast.success(t('success'))

      router.replace('/login')
      router.refresh()
    },
    onError: () => toast.error('Não foi possível redefinir a senha. Tente novamente.'),
  })

  const invalid = !token || Boolean(data?.invalid)

  if (invalid) {
    return (
      <div className="w-full max-w-[430px]">
        <header className="mb-8 text-center" aria-live="polite">
          <h2 className="mb-2 text-[34px] tracking-[-0.04em] max-[600px]:text-[30px]">
            {t('invalidTitle')}
          </h2>
          <p className="m-0 text-sm text-muted-foreground max-[600px]:text-[13px]">
            {token ? t('invalidDescription') : t('missingToken')}
          </p>
        </header>

        <Link href="/forgot-password" className={cn(buttonVariants(), AUTH_ACTION_CLASS)}>
          {t('requestNew')}
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    )
  }

  return (
    <div className="w-full max-w-[430px]">
      <header className="mb-8 text-center">
        <h2 className="mb-2 text-[34px] tracking-[-0.04em] max-[600px]:text-[30px]">
          {t('title')}
        </h2>
        <p className="m-0 text-sm text-muted-foreground max-[600px]:text-[13px]">
          {t('description')}
        </p>
      </header>

      <form
        className="flex flex-col gap-[14px]"
        onSubmit={form.handleSubmit((values) => mutate(values))}
        noValidate
      >
        <Controller
          name="password"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="gap-0">
              <FieldLabel className="mb-1.5 text-xs font-semibold" htmlFor={field.name}>
                {t('password')}
              </FieldLabel>
              <div className="relative">
                <Input
                  {...field}
                  id={field.name}
                  className="h-12 pr-12 text-[13px]"
                  type={visible ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder={t('passwordPlaceholder')}
                  aria-invalid={fieldState.invalid}
                />
                <PasswordToggleButton
                  showLabel={passwordText('show')}
                  hideLabel={passwordText('hide')}
                />
              </div>
              {fieldState.invalid && (
                <FieldError className="mt-[5px] text-xs" errors={[fieldState.error]} />
              )}
            </Field>
          )}
        />

        <Controller
          name="confirmPassword"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="gap-0">
              <FieldLabel className="mb-1.5 text-xs font-semibold" htmlFor={field.name}>
                {t('confirmPassword')}
              </FieldLabel>
              <Input
                {...field}
                id={field.name}
                className="h-12 text-[13px]"
                type={visible ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder={t('confirmPlaceholder')}
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
    </div>
  )
}
