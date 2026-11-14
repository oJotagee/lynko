'use client'

import { useMutation } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { TwoFactorPasswordField } from '@/app/[locale]/_components/two-factor-fields'
import { Button } from '@/components/ui/button'
import { startTwoFactorSetup, type TwoFactorSetup } from '../../_actions/two-factor-setup'
import { useTwoFactorPasswordSchema } from './two-factor-schema'

export function TwoFactorPasswordStep({ onDone }: { onDone: (setup: TwoFactorSetup) => void }) {
  const form = useTwoFactorPasswordSchema()

  const { mutate, isPending } = useMutation({
    mutationFn: (password: string) => startTwoFactorSetup(password),
    onSuccess: (response) => {
      if (response.data) {
        onDone(response.data)

        return
      }

      form.setError('password', { message: response.error })
    },
  })

  return (
    <form
      className="grid gap-5"
      noValidate
      onSubmit={form.handleSubmit(({ password }) => mutate(password))}
    >
      <p className="text-sm text-muted-foreground">Confirme sua senha para continuar.</p>
      <TwoFactorPasswordField control={form.control} name="password" autoFocus />
      <Button type="submit" className="min-h-11" disabled={isPending}>
        {isPending && <Loader2 className="animate-spin motion-reduce:animate-none" />}
        Continuar
      </Button>
    </form>
  )
}
