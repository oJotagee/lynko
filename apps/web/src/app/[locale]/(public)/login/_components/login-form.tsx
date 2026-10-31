'use client'

import { useMutation } from '@tanstack/react-query'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Controller } from 'react-hook-form'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Link } from '@/i18n/navigation'
import { usePasswordVisibility } from '../../_components/password-visibility'
import { login } from '../_actions/login'
import { type LoginSchemaData, useLoginSchema } from './schemas'

export function LoginForm() {
  const form = useLoginSchema()
  const { visible, setVisible } = usePasswordVisibility()
  const t = useTranslations('Auth.Login')
  const passwordText = useTranslations('Auth.Password')

  const { mutateAsync: loginMutation, isPending } = useMutation({ mutationFn: login })

  async function onSubmit(values: LoginSchemaData) {
    const response = await loginMutation(values)

    if (response.error) {
      toast.error(t('unavailable'))
    }
  }

  return (
    <form className="flex flex-col gap-[14px]" onSubmit={form.handleSubmit(onSubmit)} noValidate>
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
              className="h-12 border-[#deddd7] bg-white text-[13px]"
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

      <Controller
        name="password"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid} className="gap-0">
            <div className="flex justify-between">
              <FieldLabel className="mb-1.5 text-xs font-semibold" htmlFor={field.name}>
                {t('password')}
              </FieldLabel>
              <Link
                href="/forgot-password"
                className="text-[11px] text-[#7968e8] underline underline-offset-2"
              >
                {t('forgot')}
              </Link>
            </div>
            <div className="relative">
              <Input
                {...field}
                id={field.name}
                className="h-12 border-[#deddd7] bg-white pr-12 text-[13px]"
                type={visible ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder={t('passwordPlaceholder')}
                aria-invalid={fieldState.invalid}
              />
              <button
                className="absolute top-1/2 right-[14px] grid size-6 -translate-y-1/2 place-items-center border-0 bg-transparent p-0 text-[#77766f]"
                type="button"
                aria-label={visible ? passwordText('hide') : passwordText('show')}
                aria-pressed={visible}
                onClick={() => setVisible(!visible)}
              >
                {visible ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {fieldState.invalid && (
              <FieldError className="mt-[5px] text-xs" errors={[fieldState.error]} />
            )}
          </Field>
        )}
      />

      <Field orientation="horizontal" className="m-0 items-center gap-[9px] text-[11px]">
        <Checkbox id="remember" defaultChecked />
        <FieldLabel className="m-0 flex items-center text-[11px] leading-4" htmlFor="remember">
          {t('remember')}
        </FieldLabel>
      </Field>

      <Button
        className="h-12 w-full justify-between rounded-[10px] border-[#171716] bg-[#171716] px-[14px] text-sm font-semibold text-white transition-[transform,box-shadow,background-color] duration-200 hover:-translate-y-0.5 hover:bg-[#171716] hover:text-white hover:shadow-[0_5px_0_#17171620]"
        type="submit"
        disabled={isPending}
      >
        {isPending ? t('submitting') : t('submit')}
        {isPending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <span aria-hidden="true">→</span>
        )}
      </Button>
    </form>
  )
}
