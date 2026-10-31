'use client'

import { useMutation } from '@tanstack/react-query'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { Controller } from 'react-hook-form'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

import { usePasswordVisibility } from '../../_components/password-visibility'
import { type RegisterSchemaData, useRegisterSchema } from './schemas'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { registerUser } from '../_actions/register'
import { login } from '../../login/_actions/login'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useRouter } from '@/i18n/navigation'

export function RegisterForm() {
  const form = useRegisterSchema()
  const router = useRouter()
  const { visible, setVisible } = usePasswordVisibility()
  const t = useTranslations('Auth.Register')
  const passwordText = useTranslations('Auth.Password')

  const { mutate, isPending } = useMutation({
    mutationFn: async (values: RegisterSchemaData) => {
      const response = await registerUser(values)
      if (response.error) return response

      const session = await login({ email: values.email, password: values.password })

      if (session.error) {
        toast.success('Conta criada. Entre com seu e-mail e senha.')
        router.replace('/login')
        return {}
      }

      toast.success('Conta criada com sucesso!')
      router.replace('/dashboard')
      router.refresh()

      return {}
    },
    onSuccess: (response) => {
      if (response.error) toast.error(response.error)
    },
    onError: () => toast.error('Não foi possível concluir o cadastro. Tente novamente.'),
  })

  function onSubmit(values: RegisterSchemaData) {
    mutate(values)
  }

  return (
    <form className="flex flex-col gap-[14px]" onSubmit={form.handleSubmit(onSubmit)} noValidate>
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
