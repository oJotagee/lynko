'use client'

import { Eye, EyeOff } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Controller } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { usePasswordVisibility } from '../../_components/password-visibility'
import { useRegisterSchema } from './schemas'

export function RegisterForm() {
  const form = useRegisterSchema()
  const { visible, setVisible } = usePasswordVisibility()
  const t = useTranslations('Auth.Register')
  const passwordText = useTranslations('Auth.Password')

  return (
    <form
      className="flex flex-col gap-[14px]"
      onSubmit={form.handleSubmit(() => undefined)}
      noValidate
    >
      <Controller
        name="name"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid} className="gap-0">
            <FieldLabel htmlFor={field.name}>{t('name')}</FieldLabel>
            <Input
              {...field}
              id={field.name}
              className="h-12 border-[#deddd7] bg-white text-[13px]"
              autoComplete="name"
              placeholder={t('namePlaceholder')}
              aria-invalid={fieldState.invalid}
            />
            {fieldState.invalid && (
              <FieldError className="mt-[5px] text-xs" errors={[fieldState.error]} />
            )}
          </Field>
        )}
      />

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
            <FieldLabel className="mb-1.5 text-xs font-semibold" htmlFor={field.name}>
              {t('password')}
            </FieldLabel>
            <div className="relative">
              <Input
                {...field}
                id={field.name}
                className="h-12 border-[#deddd7] bg-white pr-12 text-[13px]"
                type={visible ? 'text' : 'password'}
                autoComplete="new-password"
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

      <Button
        className="h-12 w-full justify-between rounded-[10px] border-[#171716] bg-[#171716] px-[14px] text-sm font-semibold text-white transition-[transform,box-shadow,background-color] duration-200 hover:-translate-y-0.5 hover:bg-[#171716] hover:text-white hover:shadow-[0_5px_0_#17171620]"
        type="submit"
      >
        {t('submit')} <span aria-hidden="true">→</span>
      </Button>
    </form>
  )
}
