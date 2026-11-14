'use client'

import { useMutation } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import {
  TwoFactorCodeField,
  TwoFactorRecoveryCodeField,
} from '@/app/[locale]/_components/two-factor-fields'
import { Button } from '@/components/ui/button'
import { loginTwoFactor } from '../_actions/login-two-factor'
import { type TwoFactorLoginSchemaData, useTwoFactorLoginSchema } from './schemas'

interface TwoFactorStepProps {
  challengeToken: string
  onSuccess: () => Promise<void>
  onBack: () => void
}

function toInput(challengeToken: string, values: TwoFactorLoginSchemaData) {
  return values.method === 'code'
    ? { challengeToken, code: values.code }
    : { challengeToken, recoveryCode: values.recoveryCode }
}

export function TwoFactorStep({ challengeToken, onSuccess, onBack }: TwoFactorStepProps) {
  const t = useTranslations('Auth.TwoFactor')

  const form = useTwoFactorLoginSchema()

  const method = form.watch('method')

  const { mutate, isPending } = useMutation({
    mutationFn: (values: TwoFactorLoginSchemaData) =>
      loginTwoFactor(toInput(challengeToken, values)),
    onSuccess: async (response) => {
      if (response.expired) {
        toast.error(response.error)

        onBack()

        return
      }

      if (response.error) {
        form.setError(method === 'code' ? 'code' : 'recoveryCode', { message: response.error })

        return
      }

      await onSuccess()
    },
    onError: () => toast.error('Não foi possível entrar. Tente novamente.'),
  })

  function switchMethod() {
    form.setValue('method', method === 'code' ? 'recovery' : 'code')

    form.clearErrors()
  }

  return (
    <form
      className="flex flex-col gap-[14px]"
      noValidate
      onSubmit={form.handleSubmit((values) => mutate(values))}
    >
      <div>
        <h3 className="m-0 text-base font-semibold">{t('title')}</h3>
        <p className="mt-1 mb-0 text-[13px] text-muted-foreground">
          {method === 'code' ? t('description') : t('recoveryDescription')}
        </p>
      </div>

      {method === 'code' ? (
        <TwoFactorCodeField control={form.control} name="code" label={t('codeLabel')} autoFocus />
      ) : (
        <TwoFactorRecoveryCodeField
          control={form.control}
          name="recoveryCode"
          label={t('recoveryLabel')}
          autoFocus
        />
      )}

      <Button
        className="h-12 w-full justify-between rounded-[10px] border-[#171716] bg-[#171716] px-[14px] text-sm font-semibold text-white hover:bg-[#171716] hover:text-white"
        type="submit"
        disabled={isPending}
      >
        {isPending ? t('submitting') : t('submit')}
        {isPending ? (
          <Loader2 className="size-4 animate-spin motion-reduce:animate-none" />
        ) : (
          <span aria-hidden="true">→</span>
        )}
      </Button>

      <div className="flex flex-wrap justify-between gap-2 text-xs">
        <Button type="button" variant="link" className="h-auto p-0 text-xs" onClick={switchMethod}>
          {method === 'code' ? t('useRecovery') : t('useApp')}
        </Button>
        <Button type="button" variant="link" className="h-auto p-0 text-xs" onClick={onBack}>
          {t('back')}
        </Button>
      </div>
    </form>
  )
}
