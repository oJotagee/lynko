'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import {
  TwoFactorCodeField,
  TwoFactorPasswordField,
  TwoFactorRecoveryCodeField,
} from '@/app/[locale]/_components/two-factor-fields'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { disableTwoFactor } from '../../_actions/two-factor-disable'
import { portalTheme } from '../../_components/portal-theme'
import { type TwoFactorDisableData, useTwoFactorDisableSchema } from './two-factor-schema'

function toInput({ method, password, code, recoveryCode }: TwoFactorDisableData) {
  return method === 'code' ? { password, code } : { password, recoveryCode }
}

export function TwoFactorDisableDialog() {
  const queryClient = useQueryClient()

  const [open, setOpen] = useState(false)

  const form = useTwoFactorDisableSchema()

  const method = form.watch('method')

  const { mutate, isPending } = useMutation({
    mutationFn: (values: TwoFactorDisableData) => disableTwoFactor(toInput(values)),
    onSuccess: (response) => {
      if (response.error) {
        form.setError('root', { message: response.error })

        return
      }

      setOpen(false)

      form.reset()

      toast.success('Login em duas etapas desativado')

      void queryClient.invalidateQueries({ queryKey: ['two-factor'] })
    },
  })

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)

        if (!next) form.reset()
      }}
    >
      <DialogTrigger render={<Button variant="outline" className="min-h-11" />}>
        Desativar
      </DialogTrigger>
      <DialogContent className={portalTheme}>
        <DialogTitle>Desativar login em duas etapas?</DialogTitle>
        <DialogDescription>
          Sua conta volta a pedir só a senha. Os códigos de recuperação deixam de valer.
        </DialogDescription>
        <form
          className="grid gap-5"
          noValidate
          onSubmit={form.handleSubmit((values) => mutate(values))}
        >
          <TwoFactorPasswordField control={form.control} name="password" autoFocus />
          {method === 'code' ? (
            <TwoFactorCodeField control={form.control} name="code" />
          ) : (
            <TwoFactorRecoveryCodeField control={form.control} name="recoveryCode" />
          )}
          <Button
            type="button"
            variant="link"
            className="justify-self-start px-0"
            onClick={() => {
              form.setValue('method', method === 'code' ? 'recovery' : 'code')

              form.clearErrors()
            }}
          >
            {method === 'code' ? 'Usar um código de recuperação' : 'Usar o código do app'}
          </Button>
          {form.formState.errors.root && (
            <p role="alert" className="text-sm text-destructive">
              {form.formState.errors.root.message}
            </p>
          )}
          <Button type="submit" variant="destructive" className="min-h-11" disabled={isPending}>
            {isPending && <Loader2 className="animate-spin motion-reduce:animate-none" />}
            Desativar
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
